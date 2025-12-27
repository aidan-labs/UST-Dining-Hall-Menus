"""
scrape_ust_dining_hall_menus.py

Scrapes weekly menus for the University of St. Thomas dining halls:
- The View
- Northsider
- Cornerstone Kitchen

Each menu is saved into a separate JSON file inside the MENUS_FOLDER.
"""

import json
import html
import os
from datetime import datetime

import requests
from bs4 import BeautifulSoup


# Configuration Constants
DAY_TO_FETCH = "all" # Specify weekday, "all", or None (defaults to today)
MENUS_FOLDER = "src/data" # Output directory for JSON files

DINING_HALLS = [
    {
        "url": "https://www.stthomas.edu/dining/locations-menus-hours/the-view/menu/",
        "brunch_day": "saturday",
        "filename": "current-view-menu.json",
    },
    {
        "url": "https://www.stthomas.edu/dining/locations-menus-hours/northsider/menu/",
        "brunch_day": "sunday",
        "filename": "current-northsider-menu.json",
    },
    {
        "url": (
            "https://www.stthomas.edu/dining/locations-menus-hours/"
            "cornerstore-kitchen/menu/index.html"
        ),
        "brunch_day": None,
        "filename": "current-cornerstone-menu.json",
    },
]

# Ensure output folder exists
os.makedirs(MENUS_FOLDER, exist_ok=True)

# Day Normalization
if not DAY_TO_FETCH or DAY_TO_FETCH.lower() == "today":
    DAY_TO_FETCH = datetime.now().strftime("%A")

DAY_TO_FETCH_LOWER = DAY_TO_FETCH.lower()


def extract_menu_items(ul_tag):
    """
    Recursively extract menu items from a <ul> structure.

    Args:
        ul_tag (BeautifulSoup): The <ul> tag containing menu items.

    Returns:
        list: Nested list of menu items and categories.
    """
    items = []
    for list_item in ul_tag.find_all("li", recursive=False):
        nested_ul = list_item.find("ul")
        if nested_ul:
            category_label = html.unescape(str(list_item.contents[0]).strip())
            items.append({category_label: extract_menu_items(nested_ul)})
        else:
            items.append(html.unescape(list_item.get_text(strip=True)))
    return items


def scrape_menu(url, brunch_day, output_filename, request_timeout=10):
    """
    Scrape a dining menu from a given URL and save to JSON.

    Args:
        url (str): URL of the dining hall menu.
        brunch_day (str or None): "saturday" or "sunday" if brunch rule applies,
            otherwise None.
        output_filename (str): Name of the JSON file to write results to.
        request_timeout (int, optional): Timeout for HTTP requests in seconds.

    Returns:
        dict: Parsed menu data organized by week, meal, day, and station.
    """
    response = requests.get(url, timeout=request_timeout, verify=False)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    menu_data = {}
    meal_blocks = soup.find_all("div", class_="block-table-full-block")

    for meal_block in meal_blocks:
        # Extract meal name
        meal_name_tag = meal_block.find("h2", class_="block__heading")
        meal_name_raw = (
            meal_name_tag.get_text(strip=True) if meal_name_tag else "Unknown Meal"
        )

        # Extract week label
        week_tag = meal_block.find("div", class_="paragraph_medium")
        week_label = week_tag.get_text(strip=True) if week_tag else "Unknown Week"

        # Identify brunch
        is_brunch = "brunch" in meal_name_raw.lower()
        meal_name = "Brunch" if is_brunch else meal_name_raw

        # Extract table
        menu_table = meal_block.find("table", class_="block__table")
        if not menu_table:
            continue
        table_body = menu_table.find("tbody")

        # Handle special brunch/dinner rule
        special_day_only = brunch_day and (DAY_TO_FETCH_LOWER == brunch_day)
        if special_day_only and meal_name not in ["Brunch", "Dinner"]:
            continue

        # Handle brunch meal type
        if is_brunch:
            brunch_day_name = brunch_day.capitalize() if brunch_day else meal_name_raw
            if DAY_TO_FETCH_LOWER != "all" and brunch_day_name.lower() != DAY_TO_FETCH_LOWER:
                continue

            first_row = table_body.find("tr")
            if not first_row:
                continue

            menu_data.setdefault(week_label, {}).setdefault(meal_name, {})[brunch_day_name] = {}

            for cell in first_row.find_all(["th", "td"]):
                station_name = cell.get("data-label", "Unknown Station").strip()
                unordered_list = cell.find("ul")
                station_items = (
                    extract_menu_items(unordered_list)
                    if unordered_list
                    else [html.unescape(cell.get_text(strip=True))]
                )
                menu_data[week_label][meal_name][brunch_day_name][station_name] = (
                    station_items
                )
            continue

        # Handle dinner or other meals
        for table_row in table_body.find_all("tr"):
            day_cell = table_row.find("th", scope="row")
            if not day_cell:
                continue
            day_name = html.unescape(day_cell.get_text(strip=True))

            if DAY_TO_FETCH_LOWER != "all" and day_name.lower() != DAY_TO_FETCH_LOWER:
                continue

            if special_day_only and meal_name != "Dinner":
                continue

            menu_data.setdefault(week_label, {}).setdefault(meal_name, {})[day_name] = {}

            for cell in table_row.find_all(["th", "td"]):
                station_name = cell.get("data-label", "Unknown Station").strip()
                unordered_list = cell.find("ul")
                station_items = (
                    extract_menu_items(unordered_list)
                    if unordered_list
                    else [html.unescape(cell.get_text(strip=True))]
                )
                menu_data[week_label][meal_name][day_name][station_name] = (
                    station_items
                )

    # Ensure brunch comes before dinner on special days
    if brunch_day:
        for week_label, meal_dict in menu_data.items():
            if "Brunch" in meal_dict and "Dinner" in meal_dict:
                reordered_meals = {}
                for meal in meal_dict:
                    if meal == "Brunch":
                        reordered_meals["Brunch"] = meal_dict["Brunch"]
                    elif meal == "Dinner":
                        reordered_meals["Dinner"] = meal_dict["Dinner"]
                    else:
                        reordered_meals[meal] = meal_dict[meal]
                menu_data[week_label] = reordered_meals

    # Build full path inside MENUS_FOLDER
    output_path = os.path.join(MENUS_FOLDER, output_filename)

    # Save result to JSON
    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(menu_data, file, indent=4, ensure_ascii=False)

    return menu_data


def main():
    """Run scrapers for all dining halls and save to JSON."""
    for hall in DINING_HALLS:
        print(f"Scraping {hall['url']} → {hall['filename']}")
        scrape_menu(hall["url"], hall["brunch_day"], hall["filename"])
    print(f"All menus scraped into '{MENUS_FOLDER}/'.")


if __name__ == "__main__":
    main()
