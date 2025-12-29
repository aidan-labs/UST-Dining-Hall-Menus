# UST Dining Hall Menus

A web application for displaying University of St. Thomas dining hall menus.

## Features

- **Multi-dining hall support**: The View, Northsider, and Cornerstone Kitchen
- **Dynamic filtering**: Filter by dining hall, day, and meal type
- **Menu updates**: JSON-based menu data automatically updated via GitHub Actions

## Menu Data

Menu data is stored in JSON format in the `src/data/` directory:
- `current-view-menu.json`
- `current-northsider-menu.json` 
- `current-cornerstone-menu.json`

## Python Scraper

The `scrape_ust_dining_hall_menus.py` script fetches the weekly menus from the University of St. Thomas dining halls and saves them as JSON files in the `scripts/` directory.

## GitHub Actions Workflow

A GitHub Actions workflow called `scrape-and-deploy` runs the scraper automatically:

- **Schedule**: Every Monday at 6:30 AM (Central Time)
- **Manual Trigger**: Can also be run manually
- **Continuous Integration**: Automatically commits updated JSON files and deploys changes to the website

## Setup Steps for GitHub Actions Deployment

How I got the scraper and automatic deployment running:

1. **Configure GitHub Pages**  
   - Go to **Settings → Pages → Source**.  
   - Change the source to **GitHub Actions**.
   - Use the following configuration:
```
name: Scrape menus and deploy to GitHub Pages

on:
  schedule:
    - cron: "30 12 * * 1"
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  scrape-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          persist-credentials: true
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install requests beautifulsoup4

      - name: Run scraper
        run: python scripts/scrape_ust_dining_hall_menus.py

      - name: Commit updated menu data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/*.json
          git diff --cached --quiet || git commit -m "Update dining hall menus" && git push

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."

      - name: Deploy to GitHub Pages
        id: deploy
        uses: actions/deploy-pages@v4
```

2. **Trigger the workflow**  
   - Either wait for the scheduled job or trigger it manually from the **Actions** tab.