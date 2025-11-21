window.EmployeeManager = {
    employees: [],
    
    async init() {
      await this.loadEmployees();
      this.setupPolling(); // Poll for sync status updates
    },
    
    async loadEmployees() {
      try {
        const response = await fetch(
          `${CA.API_BASE}/employees/list?device_id=${CA.state.deviceId}&status=all`
        );
        const data = await response.json();
        
        if (data.success) {
          this.employees = data.employees;
          this.renderTable();
        }
      } catch (error) {
        console.error('[EMPLOYEE] Load failed:', error);
      }
    },
    
    renderTable() {
      const container = document.getElementById('employeeTableContainer');
      
      if (!this.employees || this.employees.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No employees registered yet.</p>';
        return;
      }
      
      let html = `
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Designation</th>
              <th>Sync Status</th>
              <th>Interactions</th>
              <th>Total Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      this.employees.forEach(emp => {
        const syncBadge = this.getSyncBadge(emp.sync_status);
        const stats = emp.stats || {};
        
        html += `
          <tr>
            <td>
              <img src="${emp.photo_url}" 
                   alt="${emp.name}" 
                   class="rounded-circle" 
                   width="40" 
                   height="40"
                   style="object-fit: cover;">
            </td>
            <td>${emp.name}</td>
            <td>${emp.phone || '-'}</td>
            <td>${emp.designation || '-'}</td>
            <td>${syncBadge}</td>
            <td>${stats.total_interactions || 0}</td>
            <td>${this.formatDuration(stats.total_time_sec || 0)}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary" onclick="EmployeeManager.editEmployee(${emp.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="EmployeeManager.deleteEmployee(${emp.id}, '${emp.name}')">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
      
      html += '</tbody></table>';
      container.innerHTML = html;
    },
    
    getSyncBadge(status) {
      const badges = {
        'synced': '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Synced</span>',
        'pending': '<span class="badge bg-warning"><i class="bi bi-clock me-1"></i>Pending</span>',
        'failed': '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Failed</span>'
      };
      return badges[status] || badges['pending'];
    },
    
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    },
    
    showAddModal() {
      const modalHTML = `
        <div class="modal fade" id="employeeModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Add Employee</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="employeeForm" enctype="multipart/form-data">
                  <div class="mb-3">
                    <label class="form-label">Photo <span class="text-danger">*</span></label>
                    <input type="file" class="form-control" id="employeePhoto" accept="image/*" required>
                    <small class="text-muted">Max 2MB. Will be optimized automatically.</small>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="employeeName" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="employeePhone">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="employeeEmail">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Designation</label>
                    <input type="text" class="form-control" id="employeeDesignation">
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="EmployeeManager.saveEmployee()">
                  <i class="bi bi-save me-1"></i>Save Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Remove existing modal if any
      const existing = document.getElementById('employeeModal');
      if (existing) existing.remove();
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
      modal.show();
    },
    
    async saveEmployee() {
      const form = document.getElementById('employeeForm');
      
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      const formData = new FormData();
      formData.append('device_id', CA.state.deviceId);
      formData.append('employee_name', document.getElementById('employeeName').value);
      formData.append('phone_number', document.getElementById('employeePhone').value);
      formData.append('email', document.getElementById('employeeEmail').value);
      formData.append('designation', document.getElementById('employeeDesignation').value);
      formData.append('photo', document.getElementById('employeePhoto').files[0]);
      
      try {
        const response = await fetch(`${CA.API_BASE}/employees/register`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert(`Employee registered successfully!\nPhoto size: ${(data.photo_size / 1024).toFixed(1)}KB\nSync status: ${data.sync_status}`);
          
          // Close modal
          bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
          
          // Reload employees
          await this.loadEmployees();
        } else {
          alert(`Failed to register employee: ${data.error}`);
        }
      } catch (error) {
        alert(`Network error: ${error.message}`);
      }
    },
    
    async deleteEmployee(id, name) {
      if (!confirm(`Delete employee "${name}"?\n\nThis will also remove all interaction history.`)) {
        return;
      }
      
      try {
        const response = await fetch(`${CA.API_BASE}/employees/${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Employee deleted successfully');
          await this.loadEmployees();
        } else {
          alert(`Failed to delete: ${data.error}`);
        }
      } catch (error) {
        alert(`Network error: ${error.message}`);
      }
    },
    
    setupPolling() {
      // Poll for sync status updates every 30 seconds
      setInterval(() => {
        this.loadEmployees();
      }, 30000);
    }
  };