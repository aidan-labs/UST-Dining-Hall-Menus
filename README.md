# UST Dining Hall Menus

A web application for displaying University of St. Thomas dining hall menus.

## Project Structure

```
├── src/                   # Source files
│   ├── app.js             # Main JavaScript application
│   └── styles.css         # CSS styles
├── public/                # Public assets
│   ├── *.json             # Menu data files
│   └── dining-hero.jpg    # Hero background image
├── scrape_ust_dining_hall_menus.py  # Python scraper script
├── index.html             # Main HTML file
└── README.md              # This file
```

## Features

- **Multi-dining hall support**: The View, Northsider, and Cornerstone Kitchen
- **Dynamic filtering**: Filter by dining hall, day, and meal type
- **Responsive design**: Works on desktop and mobile devices
- **Real-time menu updates**: JSON-based menu data automatically updated

## Menu Data

Menu data is stored in JSON format in the `public/` directory:
- `current-view-menu.json`
- `current-northsider-menu.json` 
- `current-cornerstone-menu.json`

## Python Scraper

The `scrape_ust_dining_hall_menus.py` script fetches the weekly menus from the University of St. Thomas dining halls and saves them as JSON files in the `public/` directory. 

## GitHub Actions Workflow

A GitHub Actions workflow called `scrape-and-deploy` runs the scraper automatically:

- **Schedule**: Every Monday at 6:30 AM (Central Time)
- **Manual Trigger**: Can also be run manually from the Actions tab
- **Continuous Integration**: Automatically commits updated JSON files and deploys changes to the website

This setup ensures the dining hall menus on the site are always up-to-date without manual intervention.

## Setup Steps for GitHub Actions Deployment

How I got the scraper and automatic deployment running:

1. **Create a Personal Access Token (PAT)**  
   - Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.  
   - Click **Generate new token**. Name it whatever.  
   - **Repository access**: Choose **Only select repositories** and select the target repo.  
   - **Permissions**: Click **Add permissions → Contents → Access** and change it from **Read-only** to **Read and Write**.  
   - Click **Generate token**. **Copy and save** the token securely.

2. **Add the PAT as a GitHub secret**  
   - Go to the repository **Settings → Secrets and variables → Actions → New repository secret**.  
   - Name the secret (the same name referenced in the workflow).  
   - Paste the token and click **Add secret**.

3. **Configure GitHub Pages**  
   - Go to **Settings → Pages → Source**.  
   - Change the source to **GitHub Actions**.  

4. **Trigger the workflow**  
   - Either wait for the scheduled job or trigger it manually from the **Actions** tab.

Once done, the workflow will automatically scrape menus, commit any JSON updates, and deploy the updated site.
