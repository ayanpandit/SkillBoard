# CodeChef Profile Analyzer API

A Flask-based REST API that scrapes and analyzes CodeChef user profiles to provide comprehensive competitive programming statistics.

## Features

- 🏆 Current and highest ratings
- 🌍 Global and country rankings
- ⭐ Star ratings with color coding
- 📊 Contest participation data
- 🧮 Problems solved statistics
- 🚀 Fast caching system
- 🌐 CORS enabled for web applications

## API Endpoints

### Get Profile Data
```
GET /api/profile/<username>
```

**Example:**
```bash
curl https://your-app.onrender.com/api/profile/gennady
```

**Response:**
```json
{
  "success": true,
  "name": "Gennady Korotkevich",
  "username": "gennady",
  "star": "7",
  "current_rating": "3689",
  "highest_rating": "3689",
  "global_rank": "1",
  "country": "Belarus",
  "country_rank": "1",
  "contests_participated": "26",
  "problems_solved": "450"
}
```

### Health Check
```
GET /
```

Returns API status and available endpoints.

## Deployment on Render

1. Push this directory to GitHub
2. Connect your GitHub repo to Render
3. Select this directory as the root directory
4. Render will automatically detect the `render.yaml` configuration

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python "for single/app.py"
```

3. Access the API at `http://localhost:5000`

## Environment Variables

- `PORT`: Port number (automatically set by Render)
- `FLASK_ENV`: Set to `production` for production deployment
- `PYTHON_VERSION`: Python version (set to 3.11.0)

## Technologies Used

- **Flask**: Web framework
- **BeautifulSoup4**: Web scraping
- **Requests**: HTTP requests
- **Flask-CORS**: Cross-origin resource sharing
- **Gunicorn**: WSGI server for production
