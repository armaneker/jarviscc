# Jarvis Home Automation System

A web-based home automation system with real-time camera monitoring, device control, and task management.

## Features

- **Security Cameras**: Real-time viewing of Dahua cameras with auto-discovery
- **Smart Devices**: Control smart plugs, appliances (Samsung/LG)
- **Task Management**: Track todos, refills, and maintenance tasks
- **Shopping List**: Manage shopping lists by category

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python + FastAPI + SQLAlchemy
- **Database**: SQLite
- **Streaming**: FFmpeg (RTSP to HLS conversion)

## Prerequisites

- Python 3.9+
- Node.js 18+
- FFmpeg (for camera streaming)

Install FFmpeg on macOS:
```bash
brew install ffmpeg
```

## Quick Start

### 1. Start the Backend

```bash
cd backend

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8101 --reload
```

The backend will be running at: http://localhost:8101

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The frontend will be running at: http://localhost:5501

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8101/docs
- ReDoc: http://localhost:8101/redoc

## Camera Setup

### Dahua Camera RTSP URL Format

```
rtsp://username:password@ip:554/cam/realmonitor?channel=1&subtype=1
```

- `subtype=0`: Main stream (HD quality)
- `subtype=1`: Sub stream (lower bandwidth, recommended for grid view)

### Default Dahua Credentials

- Username: `admin`
- Password: `admin` (or your custom password)

### Discovering Cameras

1. Go to the Cameras page
2. Click "Discover" button
3. Enter your network range (e.g., `192.168.1.0/24`)
4. Click "Scan" to find cameras on your network

## Project Structure

```
jarvis/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration
│   │   ├── database.py       # SQLite setup
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # API routes
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── streams/              # HLS stream output
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API client
│   │   └── types/            # TypeScript types
│   └── package.json
└── README.md
```

## Environment Variables

### Backend (.env file in backend/)

```env
DATABASE_URL=sqlite:///./jarvis.db
DEBUG=true
SECRET_KEY=replace-with-a-long-random-secret
```

### Frontend (.env file in frontend/)

```env
VITE_API_URL=http://localhost:8101
```

## Next Steps / Roadmap

- [ ] Add authentication (JWT)
- [ ] Implement smart plug integration (Tuya, Kasa)
- [ ] Samsung SmartThings integration
- [ ] LG ThinQ integration
- [ ] Motion detection alerts
- [ ] Recording/playback
- [ ] Mobile-responsive design improvements
- [ ] Migrate wall display to newer tablet hardware (low priority)
- [ ] Docker containerization
