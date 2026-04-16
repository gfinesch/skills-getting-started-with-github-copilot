document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeoutId;

  function showMessage(type, text) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    clearTimeout(messageTimeoutId);
    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        showMessage("error", result.detail || "Unable to remove participant.");
        return;
      }

      showMessage("success", result.message);
      fetchActivities();
    } catch (error) {
      showMessage("error", "Failed to remove participant. Please try again.");
      console.error("Error unregistering participant:", error);
    }
  }

  function createInfoRow(label, value) {
    const row = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `${label}:`;
    row.appendChild(strong);
    row.append(` ${value}`);

    return row;
  }

  function createParticipantsSection(activityName, participants) {
    const participantsSection = document.createElement("div");
    participantsSection.className = "participants-section";

    const participantsTitle = document.createElement("p");
    participantsTitle.className = "participants-title";
    participantsTitle.textContent = "Participants";
    participantsSection.appendChild(participantsTitle);

    if (!participants.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "participants-empty";
      emptyState.textContent = "No students have signed up yet.";
      participantsSection.appendChild(emptyState);
      return participantsSection;
    }

    const participantsList = document.createElement("div");
    participantsList.className = "participants-list";

    participants.forEach((participant) => {
      const participantItem = document.createElement("div");
      participantItem.className = "participant-item";

      const participantEmail = document.createElement("span");
      participantEmail.className = "participant-email";
      participantEmail.textContent = participant;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "participant-delete-button";
      deleteButton.setAttribute("aria-label", `Remove ${participant}`);
      deleteButton.title = `Remove ${participant}`;
      deleteButton.textContent = "x";
      deleteButton.addEventListener("click", () => {
        unregisterParticipant(activityName, participant);
      });

      participantItem.appendChild(participantEmail);
      participantItem.appendChild(deleteButton);
      participantsList.appendChild(participantItem);
    });

    participantsSection.appendChild(participantsList);
    return participantsSection;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.className = "activity-description";
        description.textContent = details.description;

        const availabilityBadge = document.createElement("span");
        availabilityBadge.className = "availability-badge";
        availabilityBadge.textContent = `${spotsLeft} spots left`;

        const meta = document.createElement("div");
        meta.className = "activity-meta";
        meta.appendChild(createInfoRow("Schedule", details.schedule));
        meta.appendChild(createInfoRow("Availability", `${spotsLeft} spots left`));

        activityCard.appendChild(title);
        activityCard.appendChild(description);
        activityCard.appendChild(availabilityBadge);
        activityCard.appendChild(meta);
        activityCard.appendChild(createParticipantsSection(name, details.participants));

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

    if (!email || !activity) {
      showMessage("error", "Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage("error", result.detail || "An error occurred");
      }
    } catch (error) {
      showMessage("error", "Failed to sign up. Please try again.");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
