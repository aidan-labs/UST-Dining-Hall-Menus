// app.js

class DiningHallApp {
  constructor() {
    this.state = {
      selectedDiningHall: 'all',
      selectedDay: this.getCurrentDay(),
      selectedMeal: 'all',
      menus: {
        view: null,
        northsider: null,
        cornerstone: null
      },
      loading: true,
      error: null
    };

    this.hallNames = {
      view: 'The View',
      northsider: 'Northsider',
      cornerstone: 'Cornerstone Kitchen'
    };

    this.init();
  }

  getCurrentDay() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }

  async init() {
    try {
      await this.loadMenus();
      this.setupEvents();
      this.setActiveDay();
      this.render();
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  setActiveDay() {
    const day = this.getCurrentDay();
    this.state.selectedDay = day;
    this.setActive('[data-day]', day);
  }

  async loadMenus() {
    try {
      this.state.loading = true;
      this.state.error = null;
      this.render();

      const [view, northsider, cornerstone] = await Promise.all([
        fetch('src/data/current-view-menu.json').then(r => r.json()),
        fetch('src/data/current-northsider-menu.json').then(r => r.json()),
        fetch('src/data/current-cornerstone-menu.json').then(r => r.json())
      ]);

      this.state.menus = { view, northsider, cornerstone };
      this.state.loading = false;
      this.render();
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      this.render();
    }
  }

  setupEvents() {
    document.querySelectorAll('[data-dining-hall]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const hall = e.target.dataset.diningHall;
        this.state.selectedDiningHall = hall;
        this.setActive('[data-dining-hall]', hall);
        this.validateAndRender();
      });
    });

    document.querySelectorAll('[data-day]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const day = e.target.dataset.day;
        this.state.selectedDay = day;
        this.setActive('[data-day]', day);
        this.validateAndRender();
      });
    });

    document.getElementById('retry-button')?.addEventListener('click', () => {
      this.loadMenus();
    });

    const backToTop = document.getElementById('back-to-top');
    backToTop?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      if (backToTop) {
        backToTop.classList.toggle('visible', window.pageYOffset > 300);
      }
    });
  }

  validateAndRender() {
    const { selectedDiningHall, selectedDay, selectedMeal } = this.state;
    
    if (!this.isValidMeal(selectedMeal, selectedDiningHall, selectedDay)) {
      this.state.selectedMeal = 'all';
    }
    
    this.render();
  }

  isValidMeal(meal, hall, day) {
    if (meal === 'all' || day === 'all') return true;

    const isSat = day === 'saturday';
    const isSun = day === 'sunday';
    const isWeekend = isSat || isSun;
    
    if (hall === 'cornerstone') {
      return !isWeekend && (meal === 'breakfast' || meal === 'lunch');
    }
    
    if (hall === 'northsider') {
      if (isSat) return false;
      if (isSun) return meal === 'brunch' || meal === 'dinner';
      return meal === 'breakfast' || meal === 'lunch' || meal === 'dinner';
    }
    
    if (hall === 'view') {
      if (isSun) return false;
      if (isSat) return meal === 'brunch' || meal === 'dinner';
      return meal === 'breakfast' || meal === 'lunch' || meal === 'dinner';
    }
    
    if (hall === 'all') {
      return isWeekend 
        ? meal === 'brunch' || meal === 'dinner'
        : meal === 'breakfast' || meal === 'lunch' || meal === 'dinner';
    }
    
    return true;
  }

  setActive(selector, value) {
    document.querySelectorAll(selector).forEach(btn => {
      const dataKey = Object.keys(btn.dataset)[0];
      btn.classList.toggle('active', btn.dataset[dataKey] === value);
    });
  }

  updateMealButtons() {
    const { selectedDiningHall, selectedDay } = this.state;
    const isSat = selectedDay === 'saturday';
    const isSun = selectedDay === 'sunday';
    const isWeekend = isSat || isSun;
    
    const container = document.getElementById('meal-buttons');
    if (!container) return;
    
    container.innerHTML = '';

    const addBtn = (value, label) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.meal = value;
      btn.textContent = label;
      
      if (value === this.state.selectedMeal) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.state.selectedMeal = value;
        this.setActive('[data-meal]', value);
        this.render();
      });

      container.appendChild(btn);
    };

    addBtn('all', 'All Meals');

    if (selectedDiningHall === 'cornerstone') {
      if (!isWeekend) {
        addBtn('breakfast', 'Breakfast');
        addBtn('lunch', 'Lunch');
      }
    } else if (selectedDiningHall === 'northsider') {
      if (!isSat) {
        if (isSun) {
          addBtn('brunch', 'Brunch');
          addBtn('dinner', 'Dinner');
        } else {
          addBtn('breakfast', 'Breakfast');
          addBtn('lunch', 'Lunch');
          addBtn('dinner', 'Dinner');
        }
      }
    } else if (selectedDiningHall === 'view') {
      if (!isSun) {
        if (isSat) {
          addBtn('brunch', 'Brunch');
          addBtn('dinner', 'Dinner');
        } else {
          addBtn('breakfast', 'Breakfast');
          addBtn('lunch', 'Lunch');
          addBtn('dinner', 'Dinner');
        }
      }
    } else {
      if (isWeekend) {
        addBtn('brunch', 'Brunch');
        addBtn('dinner', 'Dinner');
      } else {
        addBtn('breakfast', 'Breakfast');
        addBtn('lunch', 'Lunch');
        addBtn('dinner', 'Dinner');
      }
    }
  }

  render() {
    const { loading, error } = this.state;

    if (loading) {
      this.show('loading');
      this.hide('error', 'main-app');
      return;
    }

    if (error) {
      this.hide('loading', 'main-app');
      this.show('error');
      document.getElementById('error-message').textContent = error;
      return;
    }

    this.hide('loading', 'error');
    this.show('main-app');
    this.updateMealButtons();
    this.renderMenus();
  }

  show(...ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = id.includes('loading') || id.includes('error') ? 'flex' : 'block';
    });
  }

  hide(...ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  renderMenus() {
    const { selectedDiningHall, selectedDay, selectedMeal, menus } = this.state;
    const container = document.getElementById('menus');
    if (!container) return;

    const halls = selectedDiningHall === 'all' 
      ? ['view', 'northsider', 'cornerstone']
      : [selectedDiningHall];

    container.innerHTML = halls
      .map(hall => this.renderHall(hall, menus[hall], selectedDay, selectedMeal))
      .join('');
  }

  renderHall(hall, menu, day, meal) {
    // No menu data at all
    if (!menu || Object.keys(menu).length === 0) {
      return `
        <div class="menu-section">
          <div class="menu-header">
            <h2>${this.hallNames[hall]}</h2>
          </div>
          <div class="closed-message">
            <div class="closed-icon">
              <span class="material-symbols-outlined">restaurant_menu</span>
            </div>
            <h3>No Menu Data</h3>
            <p>Menu information is not currently available for ${this.hallNames[hall]}</p>
          </div>
        </div>
      `;
    }

    // Hall is closed for the selected day
    if (day !== 'all' && this.isClosed(hall, day)) {
      return `
        <div class="menu-section">
          <div class="menu-header">
            <h2>${this.hallNames[hall]}</h2>
            <p>${this.capitalize(day)}'s Menu</p>
          </div>
          <div class="closed-message">
            <div class="closed-icon">
              <span class="material-symbols-outlined">block</span>
            </div>
            <h3>Closed</h3>
            <p>${this.hallNames[hall]} is closed on ${this.capitalize(day)}s</p>
          </div>
        </div>
      `;
    }

    // Specific meal is not served at this hall
    if (meal !== 'all' && this.isMealNotServed(hall, meal, day)) {
      return `
        <div class="menu-section">
          <div class="menu-header">
            <h2>${this.hallNames[hall]}</h2>
            <p>${this.capitalize(meal)}</p>
          </div>
          <div class="closed-message">
            <div class="closed-icon">
              <span class="material-symbols-outlined">schedule</span>
            </div>
            <h3>Not Available</h3>
            <p>${this.hallNames[hall]} does not serve ${meal} ${day !== 'all' ? 'on ' + this.capitalize(day) + 's' : ''}</p>
          </div>
        </div>
      `;
    }

    const weekData = this.mergeWeeks(menu);
    
    // Filter meals
    const mealsToShow = meal === 'all' 
      ? Object.entries(weekData)
      : Object.entries(weekData).filter(([mealName]) => mealName.toLowerCase() === meal.toLowerCase());

    // No matching meals found
    if (mealsToShow.length === 0) {
      return `
        <div class="menu-section">
          <div class="menu-header">
            <h2>${this.hallNames[hall]}</h2>
            <p>${meal === 'all' ? (day === 'all' ? 'Weekly Menu' : `${this.capitalize(day)}'s Menu`) : this.capitalize(meal)}</p>
          </div>
          <div class="closed-message">
            <div class="closed-icon">
              <span class="material-symbols-outlined">info</span>
            </div>
            <h3>No Menu Available</h3>
            <p>No menu data found for the selected filters</p>
          </div>
        </div>
      `;
    }

    // Render the meals
    const mealCards = mealsToShow
      .map(([mealName, days]) => this.renderMeal(mealName, days, day))
      .filter(Boolean)
      .join('');

    // If all meals were filtered out
    if (!mealCards) {
      return `
        <div class="menu-section">
          <div class="menu-header">
            <h2>${this.hallNames[hall]}</h2>
            <p>${day === 'all' ? 'Weekly Menu' : `${this.capitalize(day)}'s Menu`}</p>
          </div>
          <div class="closed-message">
            <div class="closed-icon">
              <span class="material-symbols-outlined">info</span>
            </div>
            <h3>No Menu Available</h3>
            <p>No menu data found for ${day === 'all' ? 'this week' : this.capitalize(day)}</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="menu-section">
        <div class="menu-header">
          <h2>${this.hallNames[hall]}</h2>
          <p>${day === 'all' ? 'Weekly Menu' : `${this.capitalize(day)}'s Menu`}</p>
        </div>
        ${mealCards}
      </div>
    `;
  }

  mergeWeeks(menu) {
    const merged = {};
    Object.values(menu).forEach(week => {
      Object.entries(week).forEach(([meal, days]) => {
        if (!merged[meal]) merged[meal] = {};
        Object.assign(merged[meal], days);
      });
    });
    return merged;
  }

  isClosed(hall, day) {
    if (hall === 'cornerstone' && (day === 'saturday' || day === 'sunday')) return true;
    if (hall === 'northsider' && day === 'saturday') return true;
    if (hall === 'view' && day === 'sunday') return true;
    return false;
  }

  isMealNotServed(hall, meal, day) {
    if (meal === 'all') return false;
    
    const isSat = day === 'saturday';
    const isSun = day === 'sunday';
    
    // Cornerstone only serves breakfast and lunch on weekdays
    if (hall === 'cornerstone') {
      if (meal === 'dinner') return true;
      if (meal === 'brunch') return true;
      if ((isSat || isSun) && (meal === 'breakfast' || meal === 'lunch')) return true;
    }
    
    // Northsider on Sunday only has brunch and dinner
    if (hall === 'northsider') {
      if (isSun && (meal === 'breakfast' || meal === 'lunch')) return true;
      if (isSat) return true; // Closed on Saturday
      if (!isSun && meal === 'brunch') return true; // No brunch on weekdays
    }
    
    // The View on Saturday only has brunch and dinner
    if (hall === 'view') {
      if (isSun) return true; // Closed on Sunday
      if (isSat && (meal === 'breakfast' || meal === 'lunch')) return true;
      if (!isSat && meal === 'brunch') return true; // No brunch on weekdays
    }
    
    return false;
  }

  renderMeal(mealName, days, selectedDay) {
    const daysToShow = selectedDay === 'all' 
      ? Object.keys(days)
      : Object.keys(days).filter(d => d.toLowerCase() === selectedDay.toLowerCase());

    if (daysToShow.length === 0) return '';

    return `
      <div class="meal-card">
        <div class="meal-header">
          <div class="meal-title">
            ${mealName}
            <span class="meal-badge">
              ${daysToShow.length === 1 ? daysToShow[0] : `${daysToShow.length} days`}
            </span>
          </div>
        </div>
        <div class="meal-content">
          ${daysToShow.map(d => this.renderDay(d, days[d], selectedDay)).join('')}
        </div>
      </div>
    `;
  }

  renderDay(dayName, data, selectedDay) {
    return `
      <div class="day-section">
        ${selectedDay === 'all' ? `<h3 class="day-title">${dayName}</h3>` : ''}
        <div class="stations">
          ${Object.entries(data)
            .filter(([name]) => !name.toLowerCase().includes('day'))
            .map(([name, items]) => this.renderStation(name, items))
            .join('')}
        </div>
      </div>
    `;
  }

  renderStation(name, items) {
    return `
      <div class="station">
        <h4>${name}</h4>
        <ul>
          ${items.map(item => {
            if (typeof item === 'string') {
              return `<li>${item}</li>`;
            }
            return Object.entries(item).map(([sub, subItems]) => `
              <li class="subcategory">
                <span class="subcategory-title">${sub}:</span>
                <ul class="subcategory-items">
                  ${subItems.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </li>
            `).join('');
          }).join('')}
        </ul>
      </div>
    `;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DiningHallApp();
});
