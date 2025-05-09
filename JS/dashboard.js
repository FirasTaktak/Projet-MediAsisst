          // Function to load upcoming appointments
          function loadUpcomingAppointments() {
              // Show loading indicator
              const appointmentsContainer = document.getElementById('upcoming-appointments-preview');
              appointmentsContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';
              
              // Fetch appointments with a timestamp to prevent caching
              fetch('../process/get_appointments.php?t=' + new Date().getTime())
                  .then(response => {
                      if (!response.ok) {
                          throw new Error('Network response was not ok: ' + response.statusText);
                      }
                      return response.json();
                  })
                  .then(data => {
                      console.log('Appointments data:', data); // Debug log
                      
                      if (data.success && data.appointments && data.appointments.length > 0) {
                          appointmentsContainer.innerHTML = ''; // Clear existing content
                          
                          // Filter for upcoming appointments only (today or future)
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          const upcomingAppointments = data.appointments.filter(appt => {
                              const apptDate = new Date(appt.appointment_date);
                              return apptDate >= today;
                          });
                          
                          // Sort by date (closest first)
                          upcomingAppointments.sort((a, b) => {
                              return new Date(a.appointment_date + ' ' + a.appointment_time) - 
                                     new Date(b.appointment_date + ' ' + b.appointment_time);
                          });
                          
                          // Take only the next 3 appointments
                          const displayAppointments = upcomingAppointments.slice(0, 3);
                          
                          if (displayAppointments.length > 0) {
                              displayAppointments.forEach(appointment => {
                                  // Format date and time for display
                                  const apptDate = new Date(appointment.appointment_date);
                                  const formattedDate = apptDate.toLocaleDateString();
                                  
                                  let timeDisplay = '';
                                  if (appointment.appointment_time) {
                                      const timeParts = appointment.appointment_time.split(':');
                                      const apptTime = new Date();
                                      apptTime.setHours(timeParts[0], timeParts[1], 0);
                                      timeDisplay = ' at ' + apptTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                  }
                                  
                                  // Example of how to add the classes in JavaScript when loading appointments
                                  const today = new Date().toISOString().split('T')[0];
                                  let appointmentClass = 'appointment-item';
                                  
                                  if (appointment.appointment_date === today) {
                                      appointmentClass += ' today-appointment';
                                  } else if (appointment.appointment_date > today) {
                                      appointmentClass += ' upcoming-appointment';
                                  }
                                  
                                  // Create appointment element
                                  const appointmentElement = document.createElement('div');
                                  appointmentElement.className = appointmentClass;
                                  appointmentElement.innerHTML = `
                                      <div class="appointment-date">${formattedDate}${timeDisplay}</div>
                                      <div class="appointment-details">
                                          <h4>${appointment.appointment_type} with ${appointment.doctor_name}</h4>
                                          <p>${appointment.location || 'No location specified'}</p>
                                      </div>
                                  `;
                                  appointmentsContainer.appendChild(appointmentElement);
                              });
                              
                              document.getElementById('no-upcoming-appointments').style.display = 'none';
                              appointmentsContainer.style.display = 'block';
                          } else {
                              showNoAppointmentsMessage();
                          }
                      } else {
                          showNoAppointmentsMessage();
                      }
                  })
                  .catch(error => {
                      console.error('Error loading appointments:', error);
                      showNoAppointmentsMessage();
                  });
          }

          function showNoAppointmentsMessage() {
              document.getElementById('no-upcoming-appointments').style.display = 'block';
              document.getElementById('upcoming-appointments-preview').innerHTML = '';
          }

          // Function to load today's schedule
          function loadTodaySchedule() {
              const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
            
              fetch('../process/schedule_process.php')
                  .then(response => response.json())
                  .then(data => {
                      if (data.success && data.events && data.events.length > 0) {
                          const todayEvents = data.events.filter(event => {
                              return event.start.startsWith(today);
                          });
                        
                          const scheduleContainer = document.getElementById('today-schedule');
                          scheduleContainer.innerHTML = ''; // Clear existing content
                        
                          if (todayEvents.length > 0) {
                              todayEvents.sort((a, b) => {
                                  return new Date(a.start) - new Date(b.start);
                              }).forEach(event => {
                                  const eventTime = event.start.includes('T') 
                                      ? new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                      : 'All day';
                                
                                  const eventElement = document.createElement('div');
                                  eventElement.className = 'schedule-item';
                                  eventElement.innerHTML = `
                                      <div class="schedule-time">${eventTime}</div>
                                      <div class="schedule-details">
                                          <h4>${event.title}</h4>
                                          <p>${event.extendedProps.type}</p>
                                      </div>
                                  `;
                                  scheduleContainer.appendChild(eventElement);
                              });
                            
                              document.getElementById('no-today-schedule').style.display = 'none';
                              scheduleContainer.style.display = 'block';
                          } else {
                              document.getElementById('no-today-schedule').style.display = 'block';
                              scheduleContainer.style.display = 'none';
                          }
                      } else {
                          document.getElementById('no-today-schedule').style.display = 'block';
                          document.getElementById('today-schedule').style.display = 'none';
                      }
                  })
                  .catch(error => {
                      console.error('Error loading today\'s schedule:', error);
                      document.getElementById('no-today-schedule').style.display = 'block';
                      document.getElementById('today-schedule').style.display = 'none';
                  });
          }

          // Load user data and update dashboard
          document.addEventListener('DOMContentLoaded', function() {
              // Set current year in footer
              document.getElementById('current-year').textContent = new Date().getFullYear();
            
              // Load user data
              fetch('../process/get_user_data.php')
                  .then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          // Update user greeting
                          document.getElementById('user-greeting').textContent = `Welcome, ${data.userName}!`;
                        
                          // Update dashboard summary counts
                          document.getElementById('medication-count').textContent = `${data.medicationCount} Active`;
                          document.getElementById('appointment-count').textContent = `${data.appointmentCount} Upcoming`;
                          document.getElementById('prescription-count').textContent = `${data.prescriptionCount} Total`;
                        
                          // Show profile incomplete alert if needed
                          if (data.profileIncomplete) {
                              document.getElementById('profile-incomplete-alert').style.display = 'block';
                          }
                      }
                  })
                  .catch(error => console.error('Error loading user data:', error));
            
              // Load upcoming appointments
              loadUpcomingAppointments();
            
              // Load today's schedule
              loadTodaySchedule();
            
              // Handle loading screen
              const loadingVideo = document.getElementById('loading-video');
              const loadingScreen = document.getElementById('loading-screen');
            
              loadingVideo.addEventListener('ended', function() {
                  loadingScreen.style.opacity = '0';
                  setTimeout(() => {
                      loadingScreen.style.display = 'none';
                  }, 500);
              });
            
              // Fallback if video doesn't play or load
              setTimeout(() => {
                  if (loadingScreen.style.display !== 'none') {
                      loadingScreen.style.opacity = '0';
                      setTimeout(() => {
                          loadingScreen.style.display = 'none';
                      }, 500);
                  }
              }, 3000);
          });

          const notificationSystem = {
              shownReminders: new Set(),
              nextPollTimeout: null,
              notificationBar: null,
              notificationDot: null,
              notificationDropdown: null,
              notificationList: null,
              MINUTE: 60000,
              HOUR: 3600000,

              // Status constants matching PHP
              STATUS_PENDING: 0,
              STATUS_DELIVERED: 1,
              STATUS_READ: 2,
              STATUS_ACKNOWLEDGED: 3,


              init() {
                  // Initialize DOM elements
                  this.notificationBar = document.getElementById('notification-bar');
                  this.notificationDot = document.getElementById('notifications-dot');
                  this.notificationDropdown = document.getElementById('notification-dropdown');
                  this.notificationList = document.getElementById('notification-list');
                
                  // Force hide notification elements
                  this.hideDropdown();
                  this.notificationBar.style.display = 'none';

                  // Set up notification bell click handler
                  const bell = document.getElementById('notifications-icon');
                  const closeBtn = document.getElementById('close-dropdown');

                  bell.onclick = (e) => {
                      e.stopPropagation();
                      this.toggleDropdown();
                  };

                  closeBtn.onclick = () => {
                      this.hideDropdown();
                  };

                  document.body.addEventListener('click', (e) => {
                      if (!this.notificationDropdown.contains(e.target) &&
                          !document.getElementById('notifications-icon').contains(e.target)) {
                          this.hideDropdown();
                      }
                  });

                  // Request notification permission
                  if (window.Notification && Notification.permission !== "granted") {
                      Notification.requestPermission();
                  }

                  // Start polling for notifications
                  this.pollForNotifications();

                  // Set up polling interval (every minute)
                  setInterval(() => this.pollForNotifications(), this.MINUTE);
              },

              toggleDropdown() {
                  // Get the current computed style instead of checking inline style
                  const isVisible = window.getComputedStyle(this.notificationDropdown).display !== 'none';

                  if (isVisible) {
                      this.notificationDropdown.style.display = 'none';
                  } else {
                      // Position the dropdown
                      const bell = document.getElementById('notifications-icon');
                      const bellRect = bell.getBoundingClientRect();
        
                      this.notificationDropdown.style.position = 'fixed';
                      this.notificationDropdown.style.top = (bellRect.bottom + window.scrollY) + 'px';
                      this.notificationDropdown.style.right = (window.innerWidth - bellRect.right) + 'px';
        
                      this.notificationDropdown.style.display = 'block';
                      this.loadNotifications();
                  }
              },

              hideDropdown() {
                  if (this.notificationDropdown) {
                      this.notificationDropdown.style.display = 'none';
                      // Remove any position-related inline styles
                      this.notificationDropdown.style.removeProperty('top');
                      this.notificationDropdown.style.removeProperty('right');
                  }
              },

              async loadNotifications() {
                  this.notificationList.innerHTML = '<div style="padding:20px;text-align:center;">Loading...</div>';

                  try {
                      // Simple URL without pagination parameters
                      const url = '../process/notifications_process.php?action=get_notifications';

                      const res = await fetch(url, {
                          credentials: 'same-origin',
                          cache: 'no-cache'
                      });

                      if (!res.ok) {
                          throw new Error(`Server responded with status: ${res.status}`);
                      }

                      const data = await res.json();

                      if (data.success && data.notifications) {
                          this.notificationList.innerHTML = '';

                          if (data.notifications.length === 0) {
                              this.notificationList.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No notifications available.</div>';
                              this.updateNotificationDot(false);
                              return;
                          }

                          // Process and display notifications
                          data.notifications.forEach(notification => {
                              const item = document.createElement('div');
                              item.className = 'notification-item' + (notification.is_read ? '' : ' unread');
                              item.dataset.notificationId = notification.id;
                            
                              item.innerHTML = `
                      <div class="notification-content">
                          <strong>${this.escapeHtml(notification.title)}</strong><br>
                          <span style="font-size:0.95em;color:#666;">${this.escapeHtml(notification.message)}</span>
                      </div>
                      <div class="notification-time">
                          ${this.formatNotificationTime(notification.created_at)}
                      </div>
                  `;

                              // Mark as read when clicked
                              item.addEventListener('click', () => {
                                  this.markAsRead(notification.id);
                                  item.classList.remove('unread');
                              });

                              this.notificationList.appendChild(item);
                          });

                          // Update notification dot based on unread count
                          const hasUnread = data.notifications.some(n => !n.is_read);
                          this.updateNotificationDot(hasUnread);
                      } else {
                          throw new Error(data.message || 'Failed to load notifications');
                      }
                  } catch (e) {
                      console.error('Error loading notifications:', e);
                      this.notificationList.innerHTML = '<div style="padding:20px;text-align:center;color:#e53935;">Unable to load notifications. Please try again.</div>';
                  }
              },

              formatNotificationTime(timestamp) {
                  if (!timestamp) return '';

                  const date = new Date(timestamp);
                  const now = new Date();
                  const diffMs = now - date;
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHours / 24);

                  if (diffMins < 1) return 'Just now';
                  if (diffMins < 60) return `${diffMins}m ago`;
                  if (diffHours < 24) return `${diffHours}h ago`;
                  if (diffDays < 7) return `${diffDays}d ago`;

                  return date.toLocaleDateString();
              },

              async markAsRead(notificationId) {
                  try {
                      await fetch('../process/notifications_process.php', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                          body: `action=mark_read&notification_id=${notificationId}`
                      });

                      // Check if all notifications are now read
                      const unreadItems = this.notificationList.querySelectorAll('.notification-item.unread');
                      if (unreadItems.length === 1) { // If this was the last unread notification
                          this.updateNotificationDot(false);
                      }
                  } catch (e) {
                      console.error('Error marking notification as read:', e);
                  }
              },

              markAllAsRead() {
                  const unreadItems = this.notificationList.querySelectorAll('.notification-item.unread');
                  unreadItems.forEach(item => {
                      // Get the notification ID from a data attribute
                      const notificationId = item.dataset.notificationId;
                      if (notificationId) {
                          this.markAsRead(notificationId);
                          item.classList.remove('unread');
                      }
                  });

                  // Update the notification dot
                  this.updateNotificationDot(false);
              },

              updateNotificationDot(show) {
                  this.notificationDot.style.display = show ? 'block' : 'none';
              },

              async pollForNotifications() {
                  try {
                      // Get both notifications and reminders
                      const res = await fetch('../process/notifications_process.php?action=check_notifications');
                      const data = await res.json();

                      if (!data.success) return;

                      // Update notification dot for static notifications
                      if (data.hasUnread) {
                          this.updateNotificationDot(true);
                      }

                      // Handle active reminders
                      if (data.activeReminders && Array.isArray(data.activeReminders)) {
                          data.activeReminders.forEach(reminder => {
                              const uniqueKey = `${reminder.type}-${reminder.reference_id}-${reminder.due_time}`;

                              if (!this.shownReminders.has(uniqueKey)) {
                                  this.shownReminders.add(uniqueKey);
                                  this.showReminder(reminder);

                                  // Mark as delivered in backend
                                  this.markReminderAsDelivered(reminder.id);
                              }
                          });
                      }

                      // Schedule next check based on upcoming reminders
                      if (data.nextReminderTime) {
                          const nextTime = new Date(data.nextReminderTime).getTime();
                          const now = Date.now();
                          const timeUntilNext = Math.max(nextTime - now, this.MINUTE);

                          // Clear existing timeout and set new one
                          if (this.nextPollTimeout) {
                              clearTimeout(this.nextPollTimeout);
                          }

                          this.nextPollTimeout = setTimeout(() => {
                              this.pollForNotifications();
                          }, Math.min(timeUntilNext, this.HOUR)); // Cap at 1 hour max
                      }
                  } catch (e) {
                      console.error('Error polling for notifications:', e);
                  }
              },

              showReminder(reminder) {
                  // Show browser notification if permitted
                  if (window.Notification && Notification.permission === "granted") {
                      new Notification(reminder.title, {
                          body: reminder.message,
                          icon: "../assets/favicon.png" // Use favicon as fallback
                      });
                  }

                  // Show in notification bar
                  this.notificationBar.innerHTML = `
          <div>
              <strong>${reminder.title}</strong><br>
              <span>${reminder.message}</span>
          </div>
          <button onclick="notificationSystem.dismissNotificationBar(${reminder.id})" 
                  style="margin-top:10px;padding:5px 10px;border:none;background:#ff9800;color:white;border-radius:4px;cursor:pointer;">
              Dismiss
          </button>
      `;
                  this.notificationBar.style.display = 'block';

                  // Auto-hide after 10 seconds
                  setTimeout(() => {
                      if (this.notificationBar.style.display === 'block') {
                          this.dismissNotificationBar(reminder.id);
                      }
                  }, 10000);
              },

              async markReminderAsDelivered(reminderId) {
                  try {
                      await fetch('../process/notifications_process.php', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                          body: `action=mark_delivered&reminder_id=${reminderId}`
                      });
                  } catch (e) {
                      console.error('Error marking reminder as delivered:', e);
                  }
              },

              dismissNotificationBar(reminderId) {
                  this.notificationBar.style.display = 'none';

                  // Mark as acknowledged in backend
                  if (reminderId) {
                      this.markReminderAsAcknowledged(reminderId);
                  }
              },

              async markReminderAsAcknowledged(reminderId) {
                  try {
                      await fetch('../process/notifications_process.php', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                          body: `action=mark_acknowledged&reminder_id=${reminderId}`
                      });
                  } catch (e) {
                      console.error('Error marking reminder as acknowledged:', e);
                  }
              },

              escapeHtml(text) {
                  if (!text) return '';
                  const div = document.createElement('div');
                  div.textContent = text;
                  return div.innerHTML;
              }
          };

          // Initialize notification system when DOM is loaded
          document.addEventListener('DOMContentLoaded', () => {
              notificationSystem.init();
            
              // Set up mark all read button
              document.getElementById('mark-all-read').addEventListener('click', () => {
                  notificationSystem.markAllAsRead();
              });
            
              // Set up close button
              document.getElementById('close-dropdown').addEventListener('click', () => {
                  notificationSystem.hideDropdown();
              });
          });

          // Cleanup on page unload
          window.addEventListener('beforeunload', function() {
              // Hide dropdowns before leaving the page
              document.getElementById('notification-dropdown').style.display = 'none';
              document.getElementById('notification-bar').style.display = 'none';
            
              // Clear any stored state that might persist
              sessionStorage.removeItem('notificationDropdownOpen');
          });

          // Dark Mode Implementation
          const darkModeToggle = document.getElementById('dark-mode-toggle');
          const body = document.body;

          // Function to enable dark mode
          function enableDarkMode() {
              body.classList.add('dark-mode');
              localStorage.setItem('darkMode', 'enabled');
              updateDarkModeIcon(true);
          }

          // Function to disable dark mode
          function disableDarkMode() {
              body.classList.remove('dark-mode');
              localStorage.setItem('darkMode', 'disabled');
              updateDarkModeIcon(false);
          }

          // Function to update the dark mode icon
          function updateDarkModeIcon(isDarkMode) {
              const icon = darkModeToggle.querySelector('i');
              if (isDarkMode) {
                  icon.classList.remove('fa-moon');
                  icon.classList.add('fa-sun');
              } else {
                  icon.classList.remove('fa-sun');
                  icon.classList.add('fa-moon');
              }
          }

          // Check if user previously enabled dark mode
          if (localStorage.getItem('darkMode') === 'enabled') {
              enableDarkMode();
          }

          // Toggle dark mode when the button is clicked
          darkModeToggle.addEventListener('click', () => {
              // Check if dark mode is currently enabled
              if (body.classList.contains('dark-mode')) {
                  disableDarkMode();
              } else {
                  enableDarkMode();
              }
          });

          // Check user's system preference for dark mode
          const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

          // Initial check for system preference (only if no user preference is stored)
          if (!localStorage.getItem('darkMode')) {
              if (prefersDarkScheme.matches) {
                  enableDarkMode();
              } else {
                  disableDarkMode();
              }
          }

          // Listen for changes in system preference
          prefersDarkScheme.addEventListener('change', (e) => {
              // Only apply if user hasn't set a preference
              if (!localStorage.getItem('darkMode')) {
                  if (e.matches) {
                      enableDarkMode();
                  } else {
                      disableDarkMode();
                  }
              }
          });

          // Add this function to dashboard.js
          function debugAppointments() {
              console.log('Debugging appointments...');
              
              // Check if elements exist
              console.log('upcoming-appointments-preview exists:', !!document.getElementById('upcoming-appointments-preview'));
              console.log('no-upcoming-appointments exists:', !!document.getElementById('no-upcoming-appointments'));
              
              // Make a direct fetch request and log the result
              fetch('../process/get_appointments.php?debug=1')
                  .then(response => response.text())
                  .then(text => {
                      console.log('Raw appointment response:', text);
                      try {
                          const data = JSON.parse(text);
                          console.log('Parsed appointment data:', data);
                      } catch (e) {
                          console.error('Failed to parse JSON:', e);
                      }
                  })
                  .catch(error => {
                      console.error('Fetch error:', error);
                  });
          }

          // Call this function after page load
          document.addEventListener('DOMContentLoaded', function() {
              // Other initialization code...
              
              // Debug appointments
              debugAppointments();
              
              // Other code...
          });