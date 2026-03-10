# Backend Runtime Controls

## Start backend detached (terminal can be closed)

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\start-backend-detached.ps1
```

## Stop backend

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\stop-backend.ps1
```

## Runtime logs

- `backend/backend-runtime.out.log`
- `backend/backend-runtime.err.log`