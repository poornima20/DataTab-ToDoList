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

    let filtered = tasks.filter(task => currentFilter === 'All' || task.category === currentFilter);

    // ✅ Sort by due date — earliest first, then tasks without due date
    filtered.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1; // tasks with no due date go to bottom
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    document.querySelectorAll('.task-category').forEach(el => {
    el.style.display = currentFilter === 'All' ? 'inline' : 'none';
    });
  
    // Separate overdue, active, and completed tasks
const now = new Date();
const overdueTasks = filtered.filter(task => task.dueDate && new Date(task.dueDate) < now && !task.completed);
const activeTasks = filtered.filter(task => !task.completed && (!task.dueDate || new Date(task.dueDate) >= now));
const completedTasks = filtered.filter(task => task.completed);

// ✅ Render Overdue Tasks first
if (overdueTasks.length > 0) {
  const overdueHeader = document.createElement('div');
  overdueHeader.className = 'overdue-section-header';
  overdueHeader.innerHTML = `
    <i data-lucide="alert-triangle" class="overdue-icon"></i>
    Overdue Tasks
  `;
  list.appendChild(overdueHeader);
  lucide.createIcons();

  overdueTasks.forEach(task => createTaskElement(task, list));
}

// ✅ Then render Active Tasks
if (activeTasks.length > 0) {
  const activeHeader = document.createElement('div');
  activeHeader.className = 'active-section-header';
  activeHeader.innerHTML = `
    <i data-lucide="clock" class="active-icon"></i>
    Upcoming Tasks
  `;
  list.appendChild(activeHeader);
  lucide.createIcons();

  activeTasks.forEach(task => createTaskElement(task, list));
}

// ✅ Then your Completed Tasks section (keep existing)
if (completedTasks.length > 0) {
  const completedHeader = document.createElement('div');
  completedHeader.className = 'completed-section-header';
  completedHeader.innerHTML = `
    <i data-lucide="check-circle" class="completed-icon"></i>
    Completed Tasks
  `;
  list.appendChild(completedHeader);
  lucide.createIcons();

  completedTasks.forEach(task => createTaskElement(task, list));
}

     
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
// 📝 Inline edit handling
const labelEl = li.querySelector('.task-label');
const actionsToggle = document.getElementById('actionsToggle');

// Allow editing only if toggle is ON AND task is NOT completed
if (actionsToggle.checked && !task.completed) {
  labelEl.contentEditable = true;

  labelEl.addEventListener('click', (e) => {
    e.stopPropagation();
    showEditHint(labelEl); // optional tooltip hint
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
  // Prevent editing if completed
  labelEl.contentEditable = false;
  labelEl.classList.add('readonly-task');
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
async function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  const confirmed = await showPopup(`Delete task "${task.text}"?`, { 
    confirm: true,
    icon: 'trash-2'
  });
  if (!confirmed) return;

  tasks = tasks.filter(task => task.id !== id);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();

  showPopup('Task deleted 🗑️', { icon: 'check', duration: 2000 });
}



// ✅ Always-white popup with Lucide icons (no unwanted buttons)
function showPopup(message, options = {}) {
  const popup = document.getElementById('popupNotification');
  const messageEl = document.getElementById('popupMessage');
  const actionsEl = document.getElementById('popupActions');
  const confirmBtn = document.getElementById('popupConfirm');
  const cancelBtn = document.getElementById('popupCancel');
  const iconEl = document.getElementById('popupIcon');

  // Always white theme
  popup.style.background = '#fff';
  popup.style.color = '#000';
  messageEl.style.color = '#000';
  iconEl.style.color = '#000';

  // Set text + icon
  messageEl.textContent = message;
  iconEl.setAttribute('data-lucide', options.icon || 'sparkles');
  lucide.createIcons();

  // Reset popup completely before reuse
  popup.classList.remove('hidden', 'show');
  actionsEl.classList.add('hidden');
  confirmBtn.onclick = null;
  cancelBtn.onclick = null;

  // ✅ Confirm popup (for delete only)
  if (options.confirm === true) {
    actionsEl.classList.remove('hidden');
    popup.classList.add('show');
    return new Promise((resolve) => {
      confirmBtn.onclick = () => {
        popup.classList.remove('show');
        setTimeout(() => popup.classList.add('hidden'), 300);
        resolve(true);
      };
      cancelBtn.onclick = () => {
        popup.classList.remove('show');
        setTimeout(() => popup.classList.add('hidden'), 300);
        resolve(false);
      };
    });
  }

  // ✅ Normal popup (auto-hide, no buttons)
  popup.classList.add('show');
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.classList.add('hidden'), 300);
  }, options.duration || 2500);
}





  
  // Add new task  
 function addTask() {  
     const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (currentFilter === 'All') {
    showPopup('Please select a category to add the Task ', { icon: 'sparkles' });
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
  const label = document.getElementById('currentCategoryLabel');

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

  // ✅ Always show category name (even for All)
  label.textContent = `Selected Category: ${category}`;

  renderTasks();
}


 function renderCategoryFilters() {
    const filterContainer = document.getElementById('categoryFilters');
    filterContainer.innerHTML = ''; // Only clear once

    const toggle = document.getElementById('actionsToggle');
    const showRecycle = toggle.checked; 
    customCategories.forEach(cat => {
        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'category-wrapper';
        
        const btn = document.createElement('button');
        btn.className = 'category-button';
        btn.id = 'newSectionName';
        btn.textContent = cat.name;
        btn.style.background = cat.color;
        btn.addEventListener('click', () => filterTasks(cat.name));
        if (currentFilter === cat.name) btn.classList.add('active');
        
        // Add close button (only for non-default categories)
        if (cat.name !== 'All') {
                  // edit button (icon)
            const editBtn = document.createElement('span');
            editBtn.className = 'category-edit-btn';
            editBtn.title = `Edit "${cat.name}"`;
            editBtn.innerHTML = '&#9998;'; // pencil icon fallback
            editBtn.style.cursor = 'pointer';
            editBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              openCategoryModal(cat.name); // open modal to edit this category
            });
            btnWrapper.appendChild(editBtn);
        }
        
        // Make category name editable when toggle is on
        
            
  
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
            localStorage.setItem('tasks', JSON.stringify(tasks));
            saveCategories();

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

function resetCategoryModal() {
  const nameInput = document.getElementById('newCategoryName');
  const deleteBtn = document.getElementById('deleteCategory');
  const saveBtn = document.getElementById('saveCategory');
  const colorOptions = document.querySelectorAll('.color');

  // Clear name
  nameInput.value = '';

  // Hide delete button
  deleteBtn.style.display = 'none';

  // Reset save button text
  saveBtn.textContent = 'Add';

  // Clear color selections
  colorOptions.forEach(el => el.classList.remove('selected'));

  // Reset editing state
  editingCategoryName = null;

  document.getElementById('categoryModalTitle').textContent = 'Add New Category';

}



// Track which category is being edited (null = create mode)
let editingCategoryName = null;

function setupCategoryModal() {
  const modal = document.getElementById('categoryModal');
  const cancel = document.getElementById('cancelCategory');
  const save = document.getElementById('saveCategory');
  const deleteBtn = document.getElementById('deleteCategory');
  const colorOptions = document.querySelectorAll('.color');
  const nameInput = document.getElementById('newCategoryName');

   // Clear previous color selections
  colorOptions.forEach(el => el.classList.remove('selected'));

  // Allow color selection
  colorOptions.forEach(c => {
    c.addEventListener('click', () => {
      colorOptions.forEach(el => el.classList.remove('selected'));
      c.classList.add('selected');
      selectedColor = c.dataset.color;
    });
  });

  // Cancel
  cancel.addEventListener('click', () => {
  resetCategoryModal();
  closeCategoryModal();
});

save.addEventListener('click', () => {
  const newName = nameInput.value.trim();
  const selectedColor = document.querySelector('.color.selected')?.dataset.color;

  // 🚫 Validation rules
  if (!newName) {
    showPopup('Please enter a category name 📝', { icon: 'alert-circle' });
    return;
  }

  if (!selectedColor) {
    showPopup('Please select a color 🎨', { icon: 'alert-circle' });
    return;
  }

  // ✅ CREATE MODE
  if (!editingCategoryName) {
    // Check for duplicate names (case-insensitive)
    const duplicate = customCategories.some(
      c => c.name.toLowerCase() === newName.toLowerCase()
    );

    if (duplicate) {
      showPopup('A category with this name already exists 🚫', { icon: 'alert-triangle' });
      return;
    }

      // Add new category (no id)
  customCategories.push({
    name: newName,
    color: selectedColor
  });


    saveCategories();
    renderCategoryFilters();

    showPopup(`Category "${newName}" created 🎉`, { icon: 'check' });
    closeCategoryModal();
    return;
  }

  // ✅ EDIT MODE
  const oldName = editingCategoryName;
  const index = customCategories.findIndex(c => c.name === oldName);

  if (index === -1) {
    showPopup('Original category not found ❌', { icon: 'x-circle' });
    return;
  }

  // Prevent duplicate name (ignoring case, but allow if it's the same category being edited)
  const duplicate = customCategories.some(
    (c, i) =>
      i !== index &&
      c.name.toLowerCase() === newName.toLowerCase()
  );

  if (duplicate) {
    showPopup('A category with this name already exists 🚫', { icon: 'alert-triangle' });
    return;
  }

  // ✅ Update category name and color
  customCategories[index].name = newName;
  customCategories[index].color = selectedColor;

  // ✅ Update all tasks that used this category
  tasks.forEach(task => {
    if (task.category === oldName) task.category = newName;
  });

  saveCategories();
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderCategoryFilters();
  renderTasks();

  showPopup(`Category "${newName}" updated ✅`, { icon: 'check' });
  resetCategoryModal();
  closeCategoryModal();
});




  // Delete button
  deleteBtn.addEventListener('click', () => {
    if (!editingCategoryName) return;

    const confirmDelete = confirm(
      `Delete category "${editingCategoryName}" and all its tasks?`
    );
    if (!confirmDelete) return;

    // Remove category and tasks
    customCategories = customCategories.filter(c => c.name !== editingCategoryName);
    saveCategories();
    tasks = tasks.filter(t => t.category !== editingCategoryName);

    // Reset filter if viewing that category
    if (currentFilter === editingCategoryName) currentFilter = 'All';

    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderCategoryFilters();
    renderTasks();
    closeCategoryModal();
  });
}




function openCategoryModal(categoryName) {
  const modal = document.getElementById('categoryModal');
  const deleteBtn = document.getElementById('deleteCategory');
  const saveBtn = document.getElementById('saveCategory');
  const nameInput = document.getElementById('newCategoryName');
  const colorOptions = document.querySelectorAll('.color');
  const modalTitle = document.getElementById('categoryModalTitle');

  // Clear previous color selections
  colorOptions.forEach(el => el.classList.remove('selected'));

  if (!categoryName) {
    // 🆕 CREATE MODE
    editingCategoryName = null;
    nameInput.value = ''; // empty field
    deleteBtn.style.display = 'none'; // hide delete
    saveBtn.textContent = 'Add'; // button label
    modalTitle.textContent = 'Add New Category';
    // make sure modal resets cleanly every time
    resetCategoryModal();

    // No default color selected — user chooses one manually
  } else {
    // ✏️ EDIT MODE
    editingCategoryName = categoryName;
    const cat = customCategories.find(c => c.name === categoryName);
    if (!cat) return alert('Category not found.');

    nameInput.value = cat.name;
    deleteBtn.style.display = 'inline-block';
    saveBtn.textContent = 'Save';
    modalTitle.textContent = 'Edit Category'; // ✅ Title update

    // Highlight the saved color for that category
    const selected = Array.from(colorOptions).find(c => c.dataset.color === cat.color);
    if (selected) selected.classList.add('selected');
  }  


  // Show the modal
  modal.classList.remove('hidden');
}


// Helper: close modal
function closeCategoryModal() {
  const modal = document.getElementById('categoryModal');
  modal.classList.add('hidden');
  resetCategoryModal();
}

function saveCategories() {
  localStorage.setItem('customCategories', JSON.stringify(customCategories));
}



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

// 🧹 Reset date/time selection
document.getElementById('resetDateTime').addEventListener('click', (e) => {
  e.preventDefault();
  if (!activeTaskId) return;

  const task = tasks.find(t => t.id === activeTaskId);
  if (task && task.dueDate) {
    task.dueDate = null;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();

    document.getElementById('selectedDateTimeText').textContent = 'No date/time selected';
    showPopup('Task time cleared 🧭', { icon: 'undo-2' });
  }
});



function buildCalendar() {
  const calendarEl = document.getElementById('calendar');
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = 2025; // fixed year as per requirement

  renderCalendar(currentMonth, currentYear);

  function renderCalendar(month, year) {
    calendarEl.innerHTML = '';

let firstDay = new Date(year, month).getDay();
// Shift Sunday (0) to the end to make Monday the first day
firstDay = (firstDay === 0) ? 6 : firstDay - 1;
const daysInMonth = new Date(year, month + 1, 0).getDate();

const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

// 🗓 Month + year header
const header = document.createElement('div');
header.className = 'calendar-header';
header.innerHTML = `
  <button id="prevMonth"><i data-lucide="chevron-left"></i></button>
  <span>${monthName} ${year}</span>
  <button id="nextMonth"><i data-lucide="chevron-right"></i></button>
`;
calendarEl.appendChild(header);
lucide.createIcons();

// 🧭 Add weekday names row
const weekdays = document.createElement('div');
weekdays.className = 'calendar-weekdays';
weekdays.innerHTML = `
  <span>M</span>
  <span>T</span>
  <span>W</span>
  <span>T</span>
  <span>F</span>
  <span>S</span>
  <span>S</span>
`;
calendarEl.appendChild(weekdays);

// 📅 Date grid
const grid = document.createElement('div');
grid.className = 'calendar-grid';

    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
    const today = new Date(); // current day reference

for (let day = 1; day <= daysInMonth; day++) {
  const cell = document.createElement('div');
  cell.textContent = day;
  const cellDate = new Date(year, month, day);
  cell.dataset.date = cellDate.toISOString();
  cell.classList.add('calendar-day');

  // 🔆 Highlight today's date
  if (
    cellDate.getDate() === today.getDate() &&
    cellDate.getMonth() === today.getMonth() &&
    cellDate.getFullYear() === today.getFullYear()
  ) {
    cell.classList.add('today-date');
  }

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


