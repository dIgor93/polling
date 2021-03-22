import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.responses import RedirectResponse
from starlette.websockets import WebSocket, WebSocketDisconnect

from controller import SessionManager
from exceptions import CustomException

app = FastAPI()
app.state.session_manager = SessionManager()

app.mount("/static", StaticFiles(directory="front"), name="static")
templates = Jinja2Templates(directory="front")


@app.get("/favicon.ico")
async def favicon(request: Request):
    return RedirectResponse("/static/favicon.ico")


@app.get("/")
async def main_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/session")
async def generate_key(response: Response):
    session_id, master_key = app.state.session_manager.create_session()
    response.set_cookie(key="masterKey", value=master_key)
    return {
        "sessionId": session_id
    }


@app.get("/session/{id}")
async def poll_page(request: Request, id: str, isMaster: bool = False):
    template_response = templates.TemplateResponse("session.html", {"request": request, "id": id, "isMaster": isMaster})
    template_response.set_cookie(key="sessionId", value=id)
    return template_response


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = app.state.session_manager.get_session(session_id)

    if session:
        user_uid = session.add_voter(websocket)

        while True:
            try:
                data = await websocket.receive_json()
                operation = data.get('operation')

                if operation == 'voting':
                    session.set_vote(user_uid, data.get('vote'))

                elif operation == 'show_results':
                    session.show_results(data.get('master_key'))

                elif operation == 'reset_results':
                    session.reset_results(data.get('master_key'))

                elif operation == 'set_name':
                    session.set_name(user_uid, data.get('name'))

                await session.notify_all(session.get_state())

            except WebSocketDisconnect as e:
                print(f'WebSocketDisconnect: {e}')
                session.remove_voter(user_uid)
                await session.notify_all(session.get_state())
                break

            except CustomException as e:
                session.remove_voter(user_uid)
                await websocket.send_json({'error': e.json()})
                await websocket.close()
                break

            except Exception as e:
                session.remove_voter(user_uid)
                await websocket.send_json({'error': e})
                await websocket.close()
                break


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
