// UST Dining Hall Menu App

class DiningHallApp {
  constructor() {
    this.state = {
      selectedDiningHall: 'all',
      selectedDay: this.getCurrentDay(),
      selectedMeal: 'all',
      viewMenu: null,
      northsiderMenu: null,
      cornerstoneMenu: null,
      loading: true,
      error: null
    };

    this.init();
  }

  getCurrentDay() {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[today.getDay()];
  }

  async init() {
    try {
      await this.loadMenuData();
      this.setupEventListeners();
      this.initializeDaySelection();
      this.updateMealOptions();
      this.setCurrentYear();
      this.render();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  initializeDaySelection() {
    // Auto-select current day
    const currentDay = this.getCurrentDay();
    this.setState({ selectedDay: currentDay });
    this.updateActiveButton('[data-day]', currentDay);
  }

  setCurrentYear() {
    // Set the current year in the footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
      currentYearElement.textContent = new Date().getFullYear();
    }
  }

  async loadMenuData() {
    try {
      this.setState({ loading: true, error: null });

      // Fetch all three menus in parallel
      const [viewResponse, northsiderResponse, cornerstoneResponse] = await Promise.all([
        fetch('public/current-view-menu.json'),
        fetch('public/current-northsider-menu.json'),
        fetch('public/current-cornerstone-menu.json')
      ]);

      if (!viewResponse.ok || !northsiderResponse.ok || !cornerstoneResponse.ok) {
        throw new Error('Failed to fetch menu data');
      }

      const [viewData, northsiderData, cornerstoneData] = await Promise.all([
        viewResponse.json(),
        northsiderResponse.json(),
        cornerstoneResponse.json()
      ]);

      this.setState({
        viewMenu: viewData,
        northsiderMenu: northsiderData,
        cornerstoneMenu: cornerstoneData,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
      console.error('Error fetching menu data:', error);
    }
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  setupEventListeners() {
    // Dining hall filter buttons
    document.querySelectorAll('[data-dining-hall]').forEach(button => {
      button.addEventListener('click', (e) => {
        const diningHall = e.target.dataset.diningHall;
        this.setState({ selectedDiningHall: diningHall });
        this.updateActiveButton('[data-dining-hall]', diningHall);
        this.handleDiningHallChange();
      });
    });

    // Day filter buttons
    document.querySelectorAll('[data-day]').forEach(button => {
      button.addEventListener('click', (e) => {
        const day = e.target.dataset.day;
        this.setState({ selectedDay: day });
        this.updateActiveButton('[data-day]', day);
        this.handleDayChange();
      });
    });

    // Meal filter buttons
    document.querySelectorAll('[data-meal]').forEach(button => {
      button.addEventListener('click', (e) => {
        const meal = e.target.dataset.meal;
        this.setState({ selectedMeal: meal });
        this.updateActiveButton('[data-meal]', meal);
      });
    });

    // Retry button
    document.getElementById('retry-button').addEventListener('click', () => {
      this.loadMenuData();
    });

    // Back to top button
    document.getElementById('back-to-top').addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // Scroll listener for back to top button
    window.addEventListener('scroll', () => {
      const backToTop = document.getElementById('back-to-top');
      if (window.pageYOffset > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
  }

  handleDiningHallChange() {
    this.updateMealOptions();
    this.validateCurrentSelections();
  }

  handleDayChange() {
    this.updateMealOptions();
    this.validateCurrentSelections();
  }

  validateCurrentSelections() {
    const { selectedDiningHall, selectedDay, selectedMeal } = this.state;
    
    // Check if current meal selection is valid for the dining hall and day
    if (!this.isValidMealForDiningHall(selectedMeal, selectedDiningHall, selectedDay)) {
      this.setState({ selectedMeal: 'all' });
      this.updateActiveButton('[data-meal]', 'all');
    }
  }

  isValidMealForDiningHall(meal, diningHall, day) {
    const isSaturday = day === 'saturday';
    const isSunday = day === 'sunday';
    const isWeekend = isSaturday || isSunday;
    
    // Cornerstone Kitchen: only breakfast and lunch, weekdays only (Monday-Friday)
    if (diningHall === 'cornerstone') {
      if (isWeekend) return meal === 'all';
      return meal === 'all' || meal === 'breakfast' || meal === 'lunch';
    }
    
    // Northsider: Monday-Friday (breakfast, lunch, dinner), Saturday (closed), Sunday (brunch, dinner)
    if (diningHall === 'northsider') {
      if (isSaturday) return meal === 'all';
      if (isSunday) return meal === 'all' || meal === 'brunch' || meal === 'dinner';
      return meal === 'all' || meal === 'breakfast' || meal === 'lunch' || meal === 'dinner';
    }
    
    // The View: Monday-Friday (breakfast, lunch, dinner), Saturday (brunch, dinner), Sunday (closed)
    if (diningHall === 'view') {
      if (isSunday) return meal === 'all';
      if (isSaturday) return meal === 'all' || meal === 'brunch' || meal === 'dinner';
      return meal === 'all' || meal === 'breakfast' || meal === 'lunch' || meal === 'dinner';
    }
    
    // All halls: all meals available
    return true;
  }

  updateActiveButton(selector, value) {
    document.querySelectorAll(selector).forEach(button => {
      button.classList.remove('active');
      const dataAttr = selector.replace(/[\[\]']/g, '').replace('data-', '');
      if (button.dataset[dataAttr] === value) {
        button.classList.add('active');
      }
    });
  }

  updateMealOptions() {
    const { selectedDiningHall, selectedDay } = this.state;
    const isSaturday = selectedDay === 'saturday';
    const isSunday = selectedDay === 'sunday';
    const isWeekend = isSaturday || isSunday;
    const includesBrunch = isSaturday || selectedDay === 'all';
    
    const mealButtons = document.getElementById('meal-buttons');
    mealButtons.innerHTML = '';

    // Always show "All Meals"
    this.createMealButton('all', 'All Meals', mealButtons);

    if (selectedDiningHall === 'cornerstone') {
      // Cornerstone: only breakfast and lunch, weekdays only (Monday-Friday)
      if (!isWeekend) {
        this.createMealButton('breakfast', 'Breakfast', mealButtons);
        this.createMealButton('lunch', 'Lunch', mealButtons);
      }
    } else if (selectedDiningHall === 'northsider') {
      // Northsider: Monday-Friday (breakfast, lunch, dinner), Saturday (closed), Sunday (brunch, dinner)
      if (isSaturday) {
        // Closed on Saturday - no specific meals
      } else if (isSunday) {
        this.createMealButton('brunch', 'Brunch', mealButtons);
        this.createMealButton('dinner', 'Dinner', mealButtons);
      } else {
        // Weekdays: breakfast, lunch, dinner
        this.createMealButton('breakfast', 'Breakfast', mealButtons);
        this.createMealButton('lunch', 'Lunch', mealButtons);
        this.createMealButton('dinner', 'Dinner', mealButtons);
      }
    } else if (selectedDiningHall === 'view') {
      // The View: Monday-Friday (breakfast, lunch, dinner), Saturday (brunch, dinner), Sunday (closed)
      if (isSunday) {
        // Closed on Sunday - no specific meals
      } else if (isSaturday) {
        this.createMealButton('brunch', 'Brunch', mealButtons);
        this.createMealButton('dinner', 'Dinner', mealButtons);
      } else {
        // Weekdays: breakfast, lunch, dinner
        this.createMealButton('breakfast', 'Breakfast', mealButtons);
        this.createMealButton('lunch', 'Lunch', mealButtons);
        this.createMealButton('dinner', 'Dinner', mealButtons);
      }
    } else {
      // All halls: show all available meals
      if (!isSaturday && !isSunday) {
        this.createMealButton('breakfast', 'Breakfast', mealButtons);
        this.createMealButton('lunch', 'Lunch', mealButtons);
      }
      if (includesBrunch) {
        this.createMealButton('brunch', 'Brunch', mealButtons);
      }
      this.createMealButton('dinner', 'Dinner', mealButtons);
    }
  }

  createMealButton(value, label, container) {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.dataset.meal = value;
    button.textContent = label;
    
    if (value === this.state.selectedMeal) {
      button.classList.add('active');
    }

    button.addEventListener('click', (e) => {
      const meal = e.target.dataset.meal;
      this.setState({ selectedMeal: meal });
      this.updateActiveButton('[data-meal]', meal);
    });

    container.appendChild(button);
  }

  render() {
    const { loading, error } = this.state;

    // Show loading state
    if (loading) {
      document.getElementById('loading').style.display = 'flex';
      document.getElementById('error').style.display = 'none';
      document.getElementById('main-app').style.display = 'none';
      return;
    }

    // Show error state
    if (error) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').style.display = 'flex';
      document.getElementById('main-app').style.display = 'none';
      document.getElementById('error-message').textContent = error;
      return;
    }

    // Show main app
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';

    // Render menus
    this.renderMenus();
  }

  renderMenus() {
    const { selectedDiningHall, selectedDay, selectedMeal, viewMenu, northsiderMenu, cornerstoneMenu } = this.state;

    const showViewMenu = selectedDiningHall === 'all' || selectedDiningHall === 'view';
    const showNorthsiderMenu = selectedDiningHall === 'all' || selectedDiningHall === 'northsider';
    const showCornerstoneMenu = selectedDiningHall === 'all' || selectedDiningHall === 'cornerstone';

    // Render The View menu
    const viewSection = document.getElementById('view-menu-section');
    if (showViewMenu && viewMenu) {
      viewSection.innerHTML = this.renderMenuSection(viewMenu, 'view', selectedDay, selectedDiningHall, selectedMeal);
    } else {
      viewSection.innerHTML = '';
    }

    // Render Northsider menu
    const northsiderSection = document.getElementById('northsider-menu-section');
    if (showNorthsiderMenu && northsiderMenu) {
      northsiderSection.innerHTML = this.renderMenuSection(northsiderMenu, 'northsider', selectedDay, selectedDiningHall, selectedMeal);
    } else {
      northsiderSection.innerHTML = '';
    }

    // Render Cornerstone Kitchen menu
    const cornerstoneSection = document.getElementById('cornerstone-menu-section');
    if (showCornerstoneMenu && cornerstoneMenu) {
      cornerstoneSection.innerHTML = this.renderMenuSection(cornerstoneMenu, 'cornerstone', selectedDay, selectedDiningHall, selectedMeal);
    } else {
      cornerstoneSection.innerHTML = '';
    }
  }

  renderMenuSection(menuData, diningHall, selectedDay, selectedDiningHall, selectedMeal) {
    if (!menuData || Object.keys(menuData).length === 0) {
      return `
        <div class="text-center py-12">
          <p class="text-muted-foreground">No menu data available for ${diningHall}</p>
        </div>
      `;
    }

    // Check if dining hall is closed on this day
    if (this.isDiningHallClosed(diningHall, selectedDay)) {
      return this.renderClosedMessage(diningHall, selectedDay);
    }

    // Merge all week data (handle multiple week keys like "wk 2 & 4", "wk 4", "wk4")
    const weekData = this.mergeWeekData(menuData);
    
    return `
      <div class="menu-section">
        <div class="menu-header">
          <h2 class="menu-title">
            ${diningHall === 'view' ? 'The View' : 
              diningHall === 'northsider' ? 'Northsider' : 
              diningHall === 'cornerstone' ? 'Cornerstone Kitchen' : 
              'Dining Hall'}
          </h2>
          <p class="menu-subtitle">
            ${selectedDay === 'all' ? 'Weekly Menu' : 
              `${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Menu`}
          </p>
        </div>
        
        ${Object.entries(weekData)
          .filter(([mealName]) => 
            selectedMeal === 'all' || mealName.toLowerCase() === selectedMeal.toLowerCase()
          )
          .map(([mealName, days]) => 
            this.renderMealCard(mealName, days, selectedDay)
          ).join('')}
      </div>
    `;
  }

  mergeWeekData(menuData) {
    // Merge all week data from different week keys
    const mergedData = {};
    
    Object.values(menuData).forEach(weekData => {
      Object.entries(weekData).forEach(([mealName, mealData]) => {
        if (!mergedData[mealName]) {
          mergedData[mealName] = {};
        }
        Object.assign(mergedData[mealName], mealData);
      });
    });
    
    return mergedData;
  }

  isDiningHallClosed(diningHall, day) {
    // Cornerstone Kitchen: closed on weekends (Saturday and Sunday)
    if (diningHall === 'cornerstone' && (day === 'saturday' || day === 'sunday')) {
      return true;
    }
    
    // Northsider: closed on Saturday
    if (diningHall === 'northsider' && day === 'saturday') {
      return true;
    }
    
    // The View: closed on Sunday
    if (diningHall === 'view' && day === 'sunday') {
      return true;
    }
    
    return false;
  }

  renderClosedMessage(diningHall, day) {
    const hallName = diningHall === 'view' ? 'The View' : 
                    diningHall === 'northsider' ? 'Northsider' : 
                    diningHall === 'cornerstone' ? 'Cornerstone Kitchen' : 
                    'Dining Hall';
    
    return `
      <div class="menu-section">
        <div class="menu-header">
          <h2 class="menu-title">${hallName}</h2>
          <p class="menu-subtitle">${day.charAt(0).toUpperCase() + day.slice(1)}'s Menu</p>
        </div>
        <div class="closed-message">
          <div class="closed-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <h3 class="closed-title">Closed</h3>
          <p class="closed-text">${hallName} is closed on ${day.charAt(0).toUpperCase() + day.slice(1)}s.</p>
        </div>
      </div>
    `;
  }

  renderMealCard(mealName, days, selectedDay) {
    const daysToShow = selectedDay === 'all' 
      ? Object.keys(days)
      : Object.keys(days).filter(day => 
          day.toLowerCase() === selectedDay.toLowerCase()
        );

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
          ${daysToShow.map(dayName => this.renderDaySection(dayName, days[dayName], selectedDay)).join('')}
        </div>
      </div>
    `;
  }

  renderDaySection(dayName, dayData, selectedDay) {
    return `
      <div class="day-section">
        ${selectedDay === 'all' ? `
          <h3 class="day-title">${dayName}</h3>
        ` : ''}
        <div class="stations-grid">
          ${Object.entries(dayData).map(([stationName, items]) => 
            this.renderStation(stationName, items)
          ).join('')}
        </div>
      </div>
    `;
  }

  renderStation(stationName, items) {
    if (stationName.toLowerCase().includes('day') && items.length === 1) {
      return ''; // Skip day identifier stations
    }

    return `
      <div class="station">
        <h4 class="station-title">${stationName}</h4>
        <ul class="station-items">
          ${this.renderMenuItems(items)}
        </ul>
      </div>
    `;
  }

  renderMenuItems(items) {
    return items.map((item, index) => {
      if (typeof item === 'string') {
        return `<li class="station-item">${item}</li>`;
      } else {
        return Object.entries(item).map(([subCategory, subItems]) => `
          <li class="station-subcategory">
            <span class="subcategory-title">${subCategory}:</span>
            <ul class="subcategory-items">
              ${subItems.map(subItem => `<li class="subcategory-item">${subItem}</li>`).join('')}
            </ul>
          </li>
        `).join('');
      }
    }).join('');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DiningHallApp();
});
