// Default Tasks with completed status

let tasks = [
    { id: 1, text: 'Learn to use ToDo', category: 'Work', completed: false },  
    { id: 2, text: 'Read a book', category: 'Personal', completed: false },  
    { id: 3, text: 'Walk the dog', category: 'Personal', completed: false },  
    { id: 4, text: 'Do the laundry', category: 'Personal', completed: false }
  ];
  
  let currentFilter = 'All';
  let categories = ['All', 'Work', 'Personal'];  

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
    renderTasks();  

    document.getElementById('taskInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTask();
      }
    });
  });
  
  
  // Toggle actions visibility  
  document.getElementById('actionsToggle').addEventListener('change', function() {  
    const actionIcons = document.querySelectorAll('.icons, .filters, .drag-handle');  
    actionIcons.forEach(icon => {  
      icon.style.display = this.checked ? 'flex' : 'none';  
    });  
    localStorage.setItem('showActions', this.checked);  
  });
   
  
  // Render tasks with completed at bottom  
  function renderTasks() {  
    const list = document.getElementById('taskList');  
    list.innerHTML = '';  
    const filtered = tasks.filter(task =>  // Filter tasks based on current filter  
      currentFilter === 'All' || task.category === currentFilter  
    );   

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
  
   
      // Add completed separator if needed  
    if (completedTasks.length > 0 && activeTasks.length > 0) {  
      const separator = document.createElement('div');  
      separator.className = 'completed-separator';  
      separator.textContent = '';  
      list.appendChild(separator);  
    }
  
    // Render completed tasks  
    completedTasks.forEach(task => {  
      createTaskElement(task, list);  
    });

    // Add drop event listener
    list.addEventListener('drop', (e) => {
      e.preventDefault();
      updateTaskOrder();
    });
    
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
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
        <span class="drag-handle">⋮⋮</span>   
        <input type="checkbox" ${task.completed ? 'checked' : ''}  
               id="task-${task.id}">  
        <label for="task-${task.id}" class="${task.completed ? 'strikethrough' : ''}">  
          ${task.text} 
          ${currentFilter === 'All' ? `<span class="task-category">${task.category}</span>` : ''}
        </label>  
      </div>  
      <div class="icons" style="display: ${document.getElementById('actionsToggle').checked ? 'flex' : 'none'}">  
        <span class="edit-btn">&#9998</span>  
        <span class="delete-btn">&#10006;</span>  
      </div>  
    `;

    const dragHandle = li.querySelector('.drag-handle');
    
    // Touch/Mouse variables
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let originalY = 0;
    let draggedItem = null;
    let placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';

    // Initialize drag handle for both touch and mouse
    function initDrag(e) {
        e.preventDefault();
        isDragging = true;
        draggedItem = li;
        originalY = li.getBoundingClientRect().top;
        
        // Store initial position
        if (e.type === 'mousedown') {
            startY = e.clientY;
        } else if (e.type === 'touchstart') {
            startY = e.touches[0].clientY;
        }
        
        // Prepare dragged item
        li.classList.add('dragging');
        li.style.width = li.offsetWidth + 'px';
        li.style.height = li.offsetHeight + 'px';
        li.style.position = 'fixed';
        li.style.zIndex = '1000';
        li.style.pointerEvents = 'none';
        
        // Create placeholder
        placeholder.style.height = li.offsetHeight + 'px';
        li.parentNode.insertBefore(placeholder, li);
        
        // Add document-wide listeners
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.body.style.overflow = 'hidden';
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        // Get current position
        currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        // Move dragged item
        li.style.top = (currentY - startY + originalY) + 'px';
        
        // Find closest item
        const items = Array.from(document.querySelectorAll('#taskList li:not(.dragging)'));
        let closestItem = null;
        let closestDistance = Infinity;
        
        items.forEach(item => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.top + rect.height / 2;
            const distance = Math.abs(currentY - itemCenter);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
            }
            
            // Reset highlight
            item.classList.remove('drag-over-above', 'drag-over-below');
        });
        
        // Highlight drop position
        if (closestItem) {
            const rect = closestItem.getBoundingClientRect();
            if (currentY > rect.top + rect.height / 2) {
                closestItem.classList.add('drag-over-below');
            } else {
                closestItem.classList.add('drag-over-above');
            }
        }
    }

    function endDrag() {
        if (!isDragging) return;
        
        // Clean up events
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        document.body.style.overflow = '';
        
        // Find drop position
        const items = Array.from(document.querySelectorAll('#taskList li:not(.dragging)'));
        let dropIndex = -1;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rect = item.getBoundingClientRect();
            
            if (currentY < rect.top + rect.height / 2) {
                dropIndex = i;
                break;
            }
        }
        
        if (dropIndex === -1) dropIndex = items.length;
        
        // Remove highlight classes
        items.forEach(item => {
            item.classList.remove('drag-over-above', 'drag-over-below');
        });
        
        // Reset dragged item
        li.classList.remove('dragging');
        li.style.position = '';
        li.style.top = '';
        li.style.zIndex = '';
        li.style.width = '';
        li.style.height = '';
        li.style.pointerEvents = '';
        li.style.transform = '';
        
        // Remove placeholder
        if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
        
        // Reorder tasks if needed
        if (dropIndex !== -1) {
            const draggedId = parseInt(li.dataset.id);
            const draggedTask = tasks.find(t => t.id === draggedId);
            
            if (draggedTask) {
                tasks = tasks.filter(t => t.id !== draggedId);
                
                // Find new position
                let newIndex = dropIndex;
                if (dropIndex > 0) {
                    const prevTaskId = parseInt(items[dropIndex - 1]?.dataset.id);
                    const prevTaskIndex = tasks.findIndex(t => t.id === prevTaskId);
                    newIndex = prevTaskIndex + 1;
                }
                
                tasks.splice(newIndex, 0, draggedTask);
                renderTasks();
            }
        }
        
        isDragging = false;
        draggedItem = null;
    }

    // Add event listeners
    dragHandle.addEventListener('mousedown', initDrag);
    dragHandle.addEventListener('touchstart', initDrag, { passive: false });

    // Prevent text selection while dragging
    dragHandle.addEventListener('selectstart', (e) => {
        if (isDragging) e.preventDefault();
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const draggingElement = document.querySelector('.dragging');
      if (draggingElement && draggingElement != li){
        const rect = li.getBoundingClientRect();
         const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        if (next) {
          parent.insertBefore(draggingElement, li.nextSibling);
        } else {
          parent.insertBefore(draggingElement, li);
        }
      }
    });


   
    // Add event listeners  
    const checkbox = li.querySelector('input');  
    checkbox.addEventListener('change', () => toggleTask(task.id));  
    const label = li.querySelector('label');  
    label.addEventListener('click', () => toggleTask(task.id));   

    
    const deleteBtn = li.querySelector('.delete-btn');  
    deleteBtn.addEventListener('click', (e) => {  
      e.stopPropagation();  
      deleteTask(task.id);
      });  
    
    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const label = li.querySelector('label');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.text;
    input.className = 'edit-input';

    label.replaceWith(input);
    input.focus();

    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText !== '') {
            task.text = newText;
            // Don't change category when editing
            renderTasks();
        } else {
            input.replaceWith(label);
        }
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
});
    
     
 
    parent.appendChild(li);  
  }  

  //Update Task Order
  function updateTaskOrder() {
  const taskList = document.getElementById('taskList');
  const newOrder = Array.from(taskList.children).map(li => parseInt(li.dataset.id));
  
  // Reorder tasks array based on DOM order
  tasks.sort((a, b) => {
    return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
  });
  
  // Save to localStorage
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
   
  // Toggle task completion  
  function toggleTask(id) {  
    const task = tasks.find(t => t.id === id);  
    if (task) {  
      task.completed = !task.completed;  
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
            completed: false  
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
   
  
  // Filter tasks  
  function filterTasks(category) {
    currentFilter = category;
    const taskInput = document.getElementById('taskInput');
    
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category);
    });
    
    // Enable/disable input based on category selection
    if (category === 'All') {
        taskInput.placeholder = "Select a category first...";
        taskInput.disabled = true;
    } else {
        taskInput.placeholder = "Add a new task..."; 
        taskInput.disabled = false;
    }
    renderTasks();
}

  //pop Up code 
  let customCategories = [
    { name: 'All', color: '#ffffff' },
    { name: 'Work', color: '#cbd5ff' },
    { name: 'Personal', color: '#ffd7c2' }
  ];

  function renderCategoryFilters() {
    const filterContainer = document.getElementById('categoryFilters');
    filterContainer.innerHTML = ''; // Only clear once
    
    customCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.id = 'newSectionName';
        btn.textContent = cat.name;
        btn.style.background = cat.color;
        btn.addEventListener('click', () => filterTasks(cat.name));
        if (currentFilter === cat.name) btn.classList.add('active');
        filterContainer.appendChild(btn);
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
