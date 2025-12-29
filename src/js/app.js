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

    // Quick nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const quickNav = document.getElementById('quick-nav');
    
    navToggle?.addEventListener('click', () => {
      const isActive = quickNav.classList.toggle('active');
      navToggle.classList.toggle('active', isActive);
    });

    // Close quick nav when clicking outside
    document.addEventListener('click', (e) => {
      if (quickNav && navToggle && 
          !quickNav.contains(e.target) && 
          !navToggle.contains(e.target) && 
          quickNav.classList.contains('active')) {
        quickNav.classList.remove('active');
        navToggle.classList.remove('active');
      }
    });

    // Close quick nav when clicking any link inside it
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-nav-link')) {
        const quickNav = document.getElementById('quick-nav');
        const navToggle = document.getElementById('nav-toggle');
        if (quickNav && navToggle) {
          quickNav.classList.remove('active');
          navToggle.classList.remove('active');
        }
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
    if (meal === 'all') return true;
    
    // When day is 'all', check if the meal exists across any valid combination
    if (day === 'all') {
      return this.getAvailableMeals(hall, day).includes(meal);
    }

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

  getAvailableMeals(hall, day) {
    const isSat = day === 'saturday';
    const isSun = day === 'sunday';
    const isWeekend = isSat || isSun;
    
    // For 'all' days, return all meals that exist across the week for this hall
    if (day === 'all') {
      if (hall === 'cornerstone') {
        // Cornerstone: only weekday breakfast & lunch
        return ['breakfast', 'lunch'];
      }
      if (hall === 'northsider') {
        // Northsider: weekday breakfast/lunch/dinner + Sunday brunch/dinner
        return ['breakfast', 'lunch', 'dinner', 'brunch'];
      }
      if (hall === 'view') {
        // View: weekday breakfast/lunch/dinner + Saturday brunch/dinner
        return ['breakfast', 'lunch', 'dinner', 'brunch'];
      }
      if (hall === 'all') {
        // All halls combined: all possible meals
        return ['breakfast', 'lunch', 'dinner', 'brunch'];
      }
    }
    
    // For specific days, return meals available on that day
    const meals = [];
    
    if (hall === 'cornerstone') {
      if (!isWeekend) {
        meals.push('breakfast', 'lunch');
      }
    } else if (hall === 'northsider') {
      if (!isSat) {
        if (isSun) {
          meals.push('brunch', 'dinner');
        } else {
          meals.push('breakfast', 'lunch', 'dinner');
        }
      }
    } else if (hall === 'view') {
      if (!isSun) {
        if (isSat) {
          meals.push('brunch', 'dinner');
        } else {
          meals.push('breakfast', 'lunch', 'dinner');
        }
      }
    } else if (hall === 'all') {
      if (isWeekend) {
        meals.push('brunch', 'dinner');
      } else {
        meals.push('breakfast', 'lunch', 'dinner');
      }
    }
    
    return meals;
  }

  setActive(selector, value) {
    document.querySelectorAll(selector).forEach(btn => {
      const dataKey = Object.keys(btn.dataset)[0];
      btn.classList.toggle('active', btn.dataset[dataKey] === value);
    });
  }

  updateMealButtons() {
    const { selectedDiningHall, selectedDay, selectedMeal } = this.state;
    const availableMeals = this.getAvailableMeals(selectedDiningHall, selectedDay);
    
    // Reset to 'all' if current meal is not available
    if (selectedMeal !== 'all' && !availableMeals.includes(selectedMeal)) {
      this.state.selectedMeal = 'all';
    }
    
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

    addBtn('all', 'All');
    
    // Add buttons for available meals
    const mealOrder = ['breakfast', 'brunch', 'lunch', 'dinner'];
    mealOrder.forEach(meal => {
      if (availableMeals.includes(meal)) {
        addBtn(meal, meal.charAt(0).toUpperCase() + meal.slice(1));
      }
    });
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
    this.updateQuickNav();
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
    const hallId = `hall-${hall}`;
    
    if (!menu || Object.keys(menu).length === 0) {
      return `
        <div class="menu-section" id="${hallId}">
          <h2 class="hall-name">${this.hallNames[hall]}</h2>
          <p class="hall-subtitle">No menu data available</p>
        </div>
      `;
    }

    if (day !== 'all' && this.isClosed(hall, day)) {
      return `
        <div class="menu-section" id="${hallId}">
          <h2 class="hall-name">${this.hallNames[hall]}</h2>
          <p class="hall-subtitle">${this.capitalize(day)}'s Menu</p>
          <div class="closed-message">Closed on ${this.capitalize(day)}s</div>
        </div>
      `;
    }

    if (meal !== 'all' && this.isMealNotServed(hall, meal, day)) {
      return `
        <div class="menu-section" id="${hallId}">
          <h2 class="hall-name">${this.hallNames[hall]}</h2>
          <p class="hall-subtitle">${this.capitalize(meal)}</p>
          <div class="closed-message">
            ${this.capitalize(meal)} not available${day !== 'all' ? ' on ' + this.capitalize(day) + 's' : ''}
          </div>
        </div>
      `;
    }

    const weekData = this.mergeWeeks(menu);
    
    const mealsToShow = meal === 'all' 
      ? Object.entries(weekData)
      : Object.entries(weekData).filter(([mealName]) => mealName.toLowerCase() === meal.toLowerCase());

    if (mealsToShow.length === 0) {
      return `
        <div class="menu-section" id="${hallId}">
          <h2 class="hall-name">${this.hallNames[hall]}</h2>
          <p class="hall-subtitle">No menu available</p>
        </div>
      `;
    }

    const mealCards = mealsToShow
      .map(([mealName, days]) => this.renderMeal(mealName, days, day))
      .filter(Boolean)
      .join('');

    if (!mealCards) {
      return `
        <div class="menu-section" id="${hallId}">
          <h2 class="hall-name">${this.hallNames[hall]}</h2>
          <p class="hall-subtitle">${day === 'all' ? 'Weekly Menu' : `${this.capitalize(day)}'s Menu`}</p>
          <div class="closed-message">No menu available</div>
        </div>
      `;
    }

    return `
      <div class="menu-section" id="${hallId}">
        <h2 class="hall-name">${this.hallNames[hall]}</h2>
        <p class="hall-subtitle">${day === 'all' ? 'Weekly Menu' : `${this.capitalize(day)}'s Menu`}</p>
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
    
    // When viewing all days, check if the meal is available at all during the week
    if (day === 'all') {
      return !this.getAvailableMeals(hall, day).includes(meal);
    }
    
    const isSat = day === 'saturday';
    const isSun = day === 'sunday';
    
    if (hall === 'cornerstone') {
      if (meal === 'dinner') return true;
      if (meal === 'brunch') return true;
      if ((isSat || isSun) && (meal === 'breakfast' || meal === 'lunch')) return true;
    }
    
    if (hall === 'northsider') {
      if (isSun && (meal === 'breakfast' || meal === 'lunch')) return true;
      if (isSat) return true;
      if (!isSun && meal === 'brunch') return true;
    }
    
    if (hall === 'view') {
      if (isSun) return true;
      if (isSat && (meal === 'breakfast' || meal === 'lunch')) return true;
      if (!isSat && meal === 'brunch') return true;
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
          <span class="meal-name">${mealName}</span>
          <span class="meal-badge">${daysToShow.length === 1 ? daysToShow[0] : `${daysToShow.length} days`}</span>
        </div>
        ${daysToShow.map(d => this.renderDay(d, days[d], selectedDay)).join('')}
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
        <span class="station-name">${name}</span>
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

  updateQuickNav() {
    const container = document.getElementById('quick-nav-content');
    if (!container) return;

    const { selectedDiningHall } = this.state;
    const halls = selectedDiningHall === 'all' 
      ? ['view', 'northsider', 'cornerstone']
      : [selectedDiningHall];

    let html = `
      <div class="quick-nav-section">
        <div class="quick-nav-title">Quick Links</div>
        <a href="#" class="quick-nav-link" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); return false;">↑ To Top</a>
        <a href="#" class="quick-nav-link" onclick="window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); return false;">↓ To Bottom</a>
      </div>
    `;

    if (halls.length >= 1) {
      html += '<div class="quick-nav-divider"></div>';
      html += `
        <div class="quick-nav-section">
          <div class="quick-nav-title">Jump to Hall</div>
          ${halls.map(hall => `
            <a href="#hall-${hall}" class="quick-nav-link">${this.hallNames[hall]}</a>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = html;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DiningHallApp();
});
