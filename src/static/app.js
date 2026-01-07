document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
        const participantsList = document.getElementById("participants-list");
        const deleteParticipant = async (participant, activityName) => {
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participant)}`, {
              method: "DELETE",
            });
            if (response.ok) {
              // Refresh activities
              fetchActivities();
            } else {
              console.error("Failed to unregister");
            }
          } catch (error) {
            console.error("Error unregistering:", error);
          }
        };

        // Example of adding participants
        const addParticipant = (name) => {
          const li = document.createElement('li');
          li.textContent = name;
          const deleteIcon = document.createElement('span');
          deleteIcon.textContent = '🗑️';
          deleteIcon.className = 'delete-icon';
          deleteIcon.onclick = () => deleteParticipant(name);
          li.appendChild(deleteIcon);
          participantsList.appendChild(li);
        };
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
        `;

        const participantsUl = document.createElement("ul");
        participantsUl.style.listStyleType = 'none';
        details.participants.forEach(p => {
          const li = document.createElement('li');
          li.textContent = p;
          const deleteIcon = document.createElement('span');
          deleteIcon.textContent = '🗑️';
          deleteIcon.className = 'delete-icon';
          deleteIcon.onclick = () => deleteParticipant(p, name); // Pass activity name too
          li.appendChild(deleteIcon);
          participantsUl.appendChild(li);
        });
        activityCard.appendChild(participantsUl);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
