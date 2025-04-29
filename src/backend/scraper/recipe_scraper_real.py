import requests
from bs4 import BeautifulSoup
import csv
from urllib.parse import urljoin

BASE_URL = "https://little-alchemy.fandom.com/wiki/Elements_(Little_Alchemy_2)"


def scrape_little_alchemy_recipes():
    headers = {'User-Agent': 'Mozilla/5.0'}
    session = requests.Session()
    response = session.get(BASE_URL, headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'lxml')
    recipes = {}

    tables = soup.find_all('table')

    # print(len(tables))

    # if not tables:
    #     raise ValueError(
    #         "Recipe table not found - website structure may have changed")

    for i, table in enumerate(tables):
        # print(i)
        for row in table.find_all('tr')[1:]:  # Skip header row
            # print(row)
            cols = row.find_all('td')
            if len(cols) < 2:
                continue

            element = cols[0].get_text(strip=True)
            combinations = []

            for li in cols[1].find_all('li'):
                components = [a.get_text(strip=True) for a in li.find_all('a')
                              if 'image' not in a.get('class', [])]
                if len(components) == 2:
                    combinations.append(f"{components[0]} + {components[1]}")

            if element and combinations:
                recipes[element] = combinations

    return recipes


def save_recipes_to_csv(recipes, filename="la2_recipes.csv"):
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Element", "Combination"])
        for element, combos in recipes.items():
            for combo in combos:
                writer.writerow([element, combo])


# Run the scraper
if __name__ == "__main__":
    all_recipes = scrape_little_alchemy_recipes()
    save_recipes_to_csv(all_recipes)
    print(f"Successfully scraped {len(all_recipes)} elements!")
