// Default Tasks with completed status

let tasks = [
    { id: 1, text: 'Learn to use ToDo', category: 'Work', completed: false },  
    { id: 2, text: 'Read a book', category: 'Personal', completed: false },  
    { id: 3, text: 'Walk the dog', category: 'Personal', completed: false },  
    { id: 4, text: 'Do the laundry', category: 'Personal', completed: false }
  ];
  
  let currentFilter = 'All';     
 
  document.addEventListener('DOMContentLoaded', () => {   // Initialize on load  
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
    const actionIcons = document.querySelectorAll('.icons');  
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
  
     
    // Save to localStorage  
    localStorage.setItem('tasks', JSON.stringify(tasks));  
  }
  
     
  // Create individual task element  
  function createTaskElement(task, parent) {  
    const li = document.createElement('li');  
    li.className = task.completed ? 'completed' : '';  
    li.innerHTML = `  
      <div class="left">  
        <input type="checkbox" ${task.completed ? 'checked' : ''}  
               id="task-${task.id}">  
        <label for="task-${task.id}" class="${task.completed ? 'strikethrough' : ''}">  
          ${task.text}  
        </label>  
      </div>  
      <div class="icons" style="display: ${document.getElementById('actionsToggle').checked ? 'flex' : 'none'}">  
        <span class="edit-btn">&#9998</span>  
        <span class="delete-btn">&#10006;</span>  
      </div>  
    `;
   
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
          renderTasks();
        } else {
          input.replaceWith(label); // revert if empty
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
    if (text !== '') {  
      tasks.push({  
        id: Date.now(),  
        text,  
        category: 'Personal',  
        completed: false  
      });
  
      input.value = '';  
      renderTasks();  
    }  
  }
  
   
  
  // Filter tasks  
  function filterTasks(category) {  
    currentFilter = category;  
    document.querySelectorAll('.filters button').forEach(btn => {  
      btn.classList.toggle('active', btn.textContent === category);  
    });  
    renderTasks();  
  }
