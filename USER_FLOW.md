# 🧭 User Flow & Experience Journey

This document outlines the complete execution flow of the application from the user's perspective, detailing every interaction, visual feedback, and underlying logic.

---

## Phase 1: Initiation & Authentication
**Context**: The user arrives at the web application for the first time or after a session expiry.

1.  **Landing**: The user lands on `/login`. The interface is dark, minimal, and premium. A subtle background animation plays to set the mood.
2.  **Action**: User clicks the **"Sign In with Google"** button.
3.  **System Response**:
    *   The app redirects to Google's secure OAuth consent screen.
    *   Upon successful verification, Google redirects back to the app with a secure token.
    *   The system creates or retrieves the user's profile in the MongoDB database.
    *   **Result**: The user is granted access and redirected to the **Home (Time Machine)** page.

---

## Phase 2: The Time Machine (Home Page)
**Context**: The user needs to select a "timeline" (Year) to explore.

1.  **Visual Experience**:
    *   The user sees a **3D Year Barrel**—a floating, glowing cylinder of dates ranging from 1900 to 2050.
    *   **Atmosphere**: "Light Pillars" rise in the background, and particles float in 3D space, creating a sense of depth.
2.  **Interaction**:
    *   **Scroll/Drag**: The user clicks and drags horizontally to spin the barrel. The years whiz by with simulated momentum/physics.
    *   **Selection**: The user clicks on a specific year (e.g., **2025**).
3.  **System Response**:
    *   The camera zooms into the selected year node.
    *   The global store updates the `selectedYear` state.
    *   **Result**: The user is navigated to the **Category Selection** page.

---

## Phase 3: The Fork in the Path (Category Selection)
**Context**: The user decides what *kind* of media they are looking for in that specific year.

1.  **Visual Experience**: A specialized 3D view appears with three distinct floating nodes: **Movies**, **Series**, and **Anime**.
2.  **Interaction**: The user hovers over "Anime". The text glows and pulsates.
3.  **Action**: User clicks "Anime".
4.  **System Response**:
    *   The global store updates `selectedCategory` to 'Anime'.
    *   **Result**: The user is navigated to the **Genre Exploration** page.

---

## Phase 4: Genre Exploration (Magic Bento)
**Context**: The user fine-tunes their interest using a visual grid.

1.  **Visual Experience**:
    *   The **Magic Bento Grid** appears—a responsive layout of glowing cards representing genres (Action, Horror, Sci-Fi, etc.).
    *   The cards have valid physics-based hover effects (tilt/glare).
2.  **Interaction**: The user clicks on "Sci-Fi".
3.  **System Response**:
    *   The global store updates `selectedGenre`.
    *   **Result**: The user is pushed to the **Calendar Timeline**.

---

## Phase 5: The Calendar & Scheduling
**Context**: The core utility. The user views content availability and schedules items.

1.  **Visual Experience**:
    *   A monthly calendar view is generated for **2025**.
    *   The system fetches entries from the database for this specific user/year.
    *   The left sidebar populates with **posters** of Sci-Fi Anime (fetched via API or mocked data) relevant to 2025.
2.  **Interaction (Scheduling)**:
    *   The user sees a poster for *"Cyberpunk: Edgerunners 2"*.
    *   They **drag** the poster from the sidebar.
    *   They **drop** it onto "October 15th".
3.  **System Response**:
    *   **Immediate Feedback**: The poster snaps into the date cell instantly (Optimistic UI).
    *   **Background**: A request is sent to the backend to save this entry to MongoDB.
    *   **Status Assignment**: The item defaults to "Upcoming" (Orange clock icon).
4.  **Interaction (Status Update)**:
    *   The user clicks the item on the calendar.
    *   They toggle the status to **"Watched"**.
    *   **Result**: The icon turns green (Checkmark).

---

## Phase 6: My Space (Dashboard Management)
**Context**: The user wants to see an overview of *everything* they have collected, across all years and timelines.

1.  **Action**: User clicks the "My Space" button in the top navigation.
2.  **Visual Experience**:
    *   A sleek, grid-based dashboard appears.
    *   It displays every item the user has ever added (1900-2050).
3.  **Interaction (Filtering)**:
    *   The user clicks the **"Watched"** filter chip.
    *   The grid instantly shuffles to show only completed items.
    *   The user types "Cyberpunk" into the search bar.
4.  **Interaction (Deletion)**:
    *   The user spots a mistake ("Jumanji 3" was added accidentally).
    *   They click the **Trash Icon** on the card.
    *   **System Response**: A confirmation prompt appears. Upon "Yes", the item vanishes from the grid and is deleted from the database.

---

## Summary
The flow is circular and non-linear: users start at the **Time Machine**, dive deep into specific categories, save their findings in the **Calendar**, and manage the big picture in **My Space**.
