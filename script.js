// Default Tasks with completed status

let tasks = [
    { id: 1, text: 'Learn to use ToDo', category: 'Work', completed: false , dueDate: null},  
    { id: 2, text: 'Read a book', category: 'Personal', completed: false , dueDate: null},  
    { id: 3, text: 'Walk the dog', category: 'Personal', completed: false , dueDate: null},  
    { id: 4, text: 'Do the laundry', category: 'Personal', completed: false , dueDate: null}
  ];
  
  let currentFilter = 'All';
  let categories = ['All', 'Work', 'Personal'];  

    //pop Up code 
  let customCategories = [
    { name: 'All', color: '#ffffff' },
    { name: 'Work', color: '#cbd5ff' },
    { name: 'Personal', color: '#ffd7c2' }
  ];

 // Initialize on load  
  document.addEventListener('DOMContentLoaded', () => {   
    const toggle = document.getElementById('actionsToggle');   // Load toggle state 
    const savedPreference = localStorage.getItem('showActions') === 'true';  
    toggle.checked = savedPreference;  
    toggle.dispatchEvent(new Event('change')); 
   
  
    // Load tasks from localStorage if available  
    const savedTasks = localStorage.getItem('tasks');  
    if (savedTasks) {  
      tasks = JSON.parse(savedTasks);  
    }  

    // Load custom categories
    const stored = localStorage.getItem('customCategories');
    if (stored) {
        customCategories = JSON.parse(stored);
    }

    renderTasks();  
    renderCategoryFilters();
    setupCategoryModal();

    document.getElementById('taskInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTask();
      }
    });

        // Show/hide edit/delete + (if you ever bring it back) drag handles
      document.getElementById('actionsToggle').addEventListener('change', function () {
      const actionIcons = document.querySelectorAll('.icons, #addCategoryBtn');
      actionIcons.forEach(icon => {
        icon.style.display = this.checked ? 'flex' : 'none';
      });

      // persist preference
      localStorage.setItem('showActions', this.checked);

      // re-render buttons to reflect editable category names when toggle changes
      renderCategoryFilters();
      renderTasks();
    });

  });
  
   
  
  // Render tasks with completed at bottom  
  function renderTasks() {  
    const list = document.getElementById('taskList');  
    list.innerHTML = '';  

    const filtered = tasks.filter(task => currentFilter === 'All' || task.category === currentFilter);   

    document.querySelectorAll('.task-category').forEach(el => {
    el.style.display = currentFilter === 'All' ? 'inline' : 'none';
    });
  
    // Separate active and completed tasks  
    const activeTasks = filtered.filter(task => !task.completed);  
    const completedTasks = filtered.filter(task => task.completed);  
    
    // Render active tasks  
    activeTasks.forEach(task => {  
      createTaskElement(task, list);  
    });
  
   
     // Add completed section banner if there are completed tasks
    if (completedTasks.length > 0) {
      const completedHeader = document.createElement('div');
      completedHeader.className = 'completed-section-header';
      completedHeader.innerHTML = `
      <i data-lucide="check-circle" class="completed-icon"></i>
      Completed Tasks
    `;
      list.appendChild(completedHeader);
      lucide.createIcons();
    }

    // Render completed tasks  
    completedTasks.forEach(task => {  
      createTaskElement(task, list);  
    });   
  
     
    // Save to localStorage  
    localStorage.setItem('tasks', JSON.stringify(tasks));  
  }
  
     
  //Create individual task element  
function createTaskElement(task, parent) {
  const li = document.createElement('li');
  li.className = task.completed ? 'completed' : '';
  li.dataset.id = task.id;

li.innerHTML = `
  <div class="left">
    <button type="button" class="checkbox-btn" data-action="toggle" title="Mark as complete" aria-label="Mark as complete">
      <i data-lucide="${task.completed ? 'check' : 'circle'}" class="checkbox-icon"></i>
    </button>
    <span class="task-text ${task.completed ? 'strikethrough' : ''}">
      <span class="task-label" contenteditable="true">${task.text}</span>

      ${(task.dueDate || currentFilter === 'All') ? `
        <div class="task-meta-line">
          ${!task.completed && task.dueDate ? `<span class="task-due-date">${formatDueDate(task.dueDate)}</span>` : ''}
          ${currentFilter === 'All' 
            ? `<span class="task-category category-inline" contenteditable="false" style="background: ${getCategoryColor(task.category)}">${task.category}</span>` 
            : ''
          }
        </div>
      ` : ''}
    </span>
  </div>

  <div class="icons" style="display: ${document.getElementById('actionsToggle').checked ? 'flex' : 'none'}">
    ${!task.completed ? `<i data-lucide="clipboard-clock" class="schedule-btn" title="Set Date & Time"></i>` : ''}
    <i data-lucide="trash-2" class="delete-btn" title="Delete Task"></i>
  </div>
`;




  // ✅ Toggle complete
  li.addEventListener('click', (e) => {
    if (e.target.closest('.checkbox-btn')) {
      e.stopPropagation();
      toggleTask(task.id);
    }
  });

  parent.appendChild(li);

  // ✅ Lucide icons refresh
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }

  // ✅ Delete handler
  const iconsWrap = li.querySelector('.icons');
  iconsWrap.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
      e.stopPropagation();
      deleteTask(task.id);
    }
  });
  iconsWrap.addEventListener('click', (e) => {
  if (e.target.closest('.delete-btn')) {
    e.stopPropagation();
    deleteTask(task.id);
  }
  if (e.target.closest('.schedule-btn')) {
    e.stopPropagation();
    openDateTimePopup(task.id);
  }
});


  // 📝 Inline edit handling
const labelEl = li.querySelector('.task-label');
const actionsToggle = document.getElementById('actionsToggle');

// Only enable editing when toggle is ON
if (actionsToggle.checked) {
  labelEl.contentEditable = true;

  labelEl.addEventListener('click', (e) => {
    e.stopPropagation();
    showEditHint(labelEl);  // optional tooltip hint
  });

  labelEl.addEventListener('blur', () => saveInlineEdit(task, labelEl));
  labelEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      labelEl.blur(); // trigger save
    } else if (e.key === 'Escape') {
      labelEl.textContent = task.text; // revert
      labelEl.blur();
    }
  });
} else {
  labelEl.contentEditable = false;
}


}
 

function saveInlineEdit(task, labelEl) {
  const newText = labelEl.textContent.trim();
  if (newText) {
    task.text = newText;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
  } else {
    // Restore old text if empty
    labelEl.textContent = task.text;
  }
}

function formatDueDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const options = { hour: 'numeric', minute: '2-digit', hour12: true };
  const timeStr = date.toLocaleTimeString([], options);

  if (isToday) return `Today ${timeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr}`;

  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dateStr} ${timeStr}`;
}

   
  // Toggle task completion  
  function toggleTask(id) {  
  const task = tasks.find(t => t.id === id);  
  if (task) {  
    task.completed = !task.completed;  
    localStorage.setItem('tasks', JSON.stringify(tasks));  // ✅ Save immediately
    renderTasks(); 
  }  
}

  
  // Delete task  
  function deleteTask(id) {  
    tasks = tasks.filter(task => task.id !== id);  
    renderTasks();  
  }
  
  // Add new task  
 function addTask() {  
     const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (currentFilter === 'All') {
        alert('Please select a category before adding a task');
        return;
    }
    
    if (text !== '') {  
        tasks.push({  
            id: Date.now(),  
            text,  
            category: currentFilter, // Always use current filter
            completed: false ,
            dueDate: null
        });
        input.value = '';  
        renderTasks();  
    }  
}
 
  //Drag and drop Task 
  function moveTaskUp(id) {
  const index = tasks.findIndex(task => task.id === id);
  if (index > 0) { // Can't move first item up
    // Swap current task with the one above it
    [tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]];
    renderTasks();
  }
}
   // Add this new function to get category color
function getCategoryColor(categoryName) {
    const category = customCategories.find(cat => cat.name === categoryName);
    return category ? category.color : '#e0e0e0'; // default light gray if not found
}
  
  // Filter tasks  
  function filterTasks(category) {
    currentFilter = category;
    const taskInput = document.getElementById('taskInput');
    
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category);
    });
    
    // Enable/disable input based on category selection
    if (category === 'All') {
        taskInput.placeholder = "Select a category from above ...";
        taskInput.disabled = true;
    } else {
        taskInput.placeholder = "Add a new task..."; 
        taskInput.disabled = false;
    }
    renderTasks();
}



 function renderCategoryFilters() {
    const filterContainer = document.getElementById('categoryFilters');
    filterContainer.innerHTML = ''; // Only clear once
    
    customCategories.forEach(cat => {
        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'category-wrapper';
        
        const btn = document.createElement('button');
         btn.id = 'newSectionName';
        btn.textContent = cat.name;
        btn.style.background = cat.color;
        btn.addEventListener('click', () => filterTasks(cat.name));
        if (currentFilter === cat.name) btn.classList.add('active');
        
        // Add close button (only for non-default categories)
        if (cat.name !== 'All') {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'category-close-btn';
            closeBtn.innerHTML = '&#10006;';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete category "${cat.name}" and all its tasks?`)) {
                    // Delete tasks in this category first
                    tasks = tasks.filter(task => task.category !== cat.name);
                    // Then delete the category
                    customCategories = customCategories.filter(c => c.name !== cat.name);
                    // If we were filtering by this category, switch to All
                    if (currentFilter === cat.name) {
                        currentFilter = 'All';
                        filterTasks('All');
                    }
                    renderCategoryFilters();
                    // Save to localStorage
                    localStorage.setItem('customCategories', JSON.stringify(customCategories));
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                }
            });
            btnWrapper.appendChild(closeBtn);
        }
        
        // Make category name editable when toggle is on
        
            
          // Make category name editable when toggle is on (but not for "All")
const toggle = document.getElementById('actionsToggle');
if (toggle.checked && cat.name !== 'All') {
    btn.contentEditable = true;
    btn.addEventListener('blur', () => {
        const newName = btn.textContent.trim();
        if (newName && newName !== cat.name && !customCategories.find(c => c.name === newName)) {
            // Update category name in customCategories
            const oldName = cat.name;
            cat.name = newName;

            // Update category name in all tasks
            tasks.forEach(task => {
                if (task.category === oldName) {
                    task.category = newName;
                }
            });

            // If we were filtering by this category, update currentFilter
            if (currentFilter === oldName) {
                currentFilter = newName;
            }

            // Save changes
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } else {
            // Revert if invalid
            btn.textContent = cat.name;
        }
    });

    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btn.blur();
        }
    });
} else {
    btn.contentEditable = false;
}

        
        btnWrapper.appendChild(btn);
        filterContainer.appendChild(btnWrapper);
    });
    
    // Add "+ Category" button
    const addBtn = document.createElement('button');
    addBtn.id = 'addCategoryBtn';
    addBtn.textContent = '+ Category';
    addBtn.addEventListener('click', () => {
        document.getElementById('categoryModal').classList.remove('hidden');
    });
    filterContainer.appendChild(addBtn);
}




  function setupCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const cancel = document.getElementById('cancelCategory');
    const save = document.getElementById('saveCategory');
    const colorOptions = document.querySelectorAll('.color');
  
    let selectedColor = '#2f2f2f';
  
    colorOptions.forEach(c => {
      c.addEventListener('click', () => {
        colorOptions.forEach(el => el.classList.remove('selected'));
        c.classList.add('selected');
        selectedColor = c.dataset.color;
      });
    });
    cancel.addEventListener('click', () => {
      modal.classList.add('hidden');
      document.getElementById('newCategoryName').value = '';
    });
  
    save.addEventListener('click', () => {
      const name = document.getElementById('newCategoryName').value.trim();
      if (name && !customCategories.find(c => c.name === name)) {
        customCategories.push({ name, color: selectedColor });
        renderCategoryFilters();
      }

          // Save to localStorage
      localStorage.setItem('customCategories', JSON.stringify(customCategories));

  

      modal.classList.add('hidden');
      document.getElementById('newCategoryName').value = '';
    });
  }


  document.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('customCategories');
  if (stored) {
    customCategories = JSON.parse(stored);
  }
    renderCategoryFilters();
    setupCategoryModal();
  });

let activeTaskId = null;
let selectedDateISO = null;

function openDateTimePopup(taskId) {
  activeTaskId = taskId;
  const task = tasks.find(t => t.id === taskId);
  document.getElementById('dateTimeTaskInfo').textContent = `For: "${task.text}"`;
  document.getElementById('selectedDateTimeText').textContent = 'No date & time selected';

  const modal = document.getElementById('dateTimeModal');
  modal.classList.add('show');     // ✅ trigger the transition
  modal.classList.remove('hidden');

  setTimeout(buildCalendar, 0);
}

document.getElementById('cancelDateTime').addEventListener('click', () => {
  const modal = document.getElementById('dateTimeModal');
  modal.classList.remove('show');
  modal.classList.add('hidden');
  selectedDateISO = null;
});



// 📝 Update summary whenever something changes
function updateSummary() {
  if (!selectedDateISO) {
    document.getElementById('selectedDateTimeText').textContent = 'No date/time selected';
    return;
  }
  const date = new Date(selectedDateISO);
  const hour = document.getElementById('hourSelect').value;
  const minute = document.getElementById('minuteSelect').value;
  const ampm = document.getElementById('ampmSelect').value;

  const displayTime = `${hour}:${minute} ${ampm}`;
  const formatted = `${date.toDateString()} at ${displayTime}`;
  document.getElementById('selectedDateTimeText').textContent = formatted;
}

// 📅 Calendar date click sets selectedDateISO
function selectDate(iso) {
  selectedDateISO = iso;
  updateSummary();
}


//Popup for time and date and then month render 
document.getElementById('saveDateTime').addEventListener('click', () => {
  if (!activeTaskId || !selectedDateISO) return;
  const task = tasks.find(t => t.id === activeTaskId);

  const date = new Date(selectedDateISO);
  let hour = parseInt(document.getElementById('hourSelect').value);
  let minute = parseInt(document.getElementById('minuteSelect').value);
  const ampm = document.getElementById('ampmSelect').value;
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(0);

  task.dueDate = date.toISOString();
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
  document.getElementById('dateTimeModal').classList.add('hidden');
});



function buildCalendar() {
  const calendarEl = document.getElementById('calendar');
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = 2025; // fixed year as per requirement

  renderCalendar(currentMonth, currentYear);

  function renderCalendar(month, year) {
    calendarEl.innerHTML = '';
    const firstDay = new Date(year, month).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
  <button id="prevMonth"><i data-lucide="chevron-left"></i></button>
  <span>${monthName} ${year}</span>
  <button id="nextMonth"><i data-lucide="chevron-right"></i></button>
`;
    calendarEl.appendChild(header);
    lucide.createIcons();

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.textContent = day;
      cell.dataset.date = new Date(year, month, day).toISOString();
      cell.classList.add('calendar-day');
      cell.addEventListener('click', () => {
  document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected-date'));
  cell.classList.add('selected-date');
  selectDate(cell.dataset.date);
  
});

      grid.appendChild(cell);
    }
    calendarEl.appendChild(grid);

    document.getElementById('prevMonth').onclick = () => {
      if (month > 0) renderCalendar(month-1, year);
    };
    document.getElementById('nextMonth').onclick = () => {
      if (month < 11) renderCalendar(month+1, year);
    };
  }
}
document.getElementById('hourSelect').addEventListener('change', updateSummary);
document.getElementById('minuteSelect').addEventListener('change', updateSummary);
document.getElementById('ampmSelect').addEventListener('change', updateSummary);

function buildTimeDropdowns() {
  const hourSelect = document.getElementById('hourSelect');
  const minuteSelect = document.getElementById('minuteSelect');
  for (let h = 1; h <= 12; h++) {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    hourSelect.appendChild(opt);
  }
  ['00','30'].forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    minuteSelect.appendChild(opt);
  });
}
buildTimeDropdowns();

