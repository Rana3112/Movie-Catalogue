# 🎬 3D Time-Travel Movie Catalogue

> A cinematic, immersive web experience for discovering and tracking media across time.

This project is not just a standard movie database; it is a **3D spatial interface** that reimagines how we explore content. Instead of scrolling through infinite lists, users "travel" through time using a 3D Year Barrel, explore genres in a responsive "Magic Bento" grid, and curating their personal timeline in a drag-and-drop calendar.

![Project Screenshot](https://raw.githubusercontent.com/Rana3112/Movie-Catalogue/main/screenshot.png) *(Replace with actual screenshot link)*

## 🚀 Concept
The core idea was to make the *act of discovery* feel like part of the movie experience. The UI uses dark, cinematic aesthetics, glassmorphism, and 3D floating elements to create a sense of depth and immersion.

## 🛠️ Tech Stack

### Frontend Core
-   **React 18 + Vite**: Chosen for lightning-fast HMR and optimized production builds.
-   **Zustand**: A lightweight, scalable state management solution used to handle:
    -   Global user authentication state.
    -   The "Time Machine" state (`selectedYear`, `selectedCategory`).
    -   Complex Calendar entry management (CRUD operations).
-   **React Router DOM**: Handles client-side routing with protected routes for authenticated areas.

### 3D & Animation
-   **Three.js**: The backbone of all 3D elements.
-   **React Three Fiber (R3F)**: A React renderer for Three.js, allowing us to compose 3D scenes as declarative components.
-   **Drei**: Helper library for useful R3F abstractions (Text, Lines, Effects).
-   **Custom Shaders (GLSL)**:
    -   Used in the `YearBarrel` and `CategoryBarrel` components to create glowing, pulsating borders and hover effects that standard materials cannot achieve.
    -   Implemented "Light Pillars" with procedural noise and wave deformation for background ambiance.

### UI & Styling
-   **TailwindCSS**: For rapid, utility-first styling of the 2D interface.
-   **Lucide React**: Consistent, clean iconography.
-   **CSS Modules/Custom CSS**: Used for complex animations like the `Magic Bento` grid and floating particles.
-   **Glassmorphism**: Heavy use of `backdrop-filter: blur`, translucency, and subtle borders to create a premium, layered feel.

### Backend & Data
-   **Node.js + Express**: Serves the REST API.
-   **MongoDB (Mongoose)**: Stores user data and calendar entries.
-   **Google OAuth 2.0**: Secure authentication flow.

## 🌟 Key Features & Implementation Details

### 1. The Time Machine (Year Barrel)
*   **Technique**: We created a custom cylindrical geometry where years are nodes on "branches" extending from a central timeline.
*   **Interaction**: Users can drag to rotate the barrel (using `@use-gesture/react`) or click a specific year.
*   **Optimization**: Implemented `useMemo` for geometry calculations and `requestAnimationFrame` cleanup to ensure smooth 60fps performance without memory leaks.

### 2. Magic Bento Grid (Genres)
*   **Design**: A responsive grid system that seemingly "floats" in space.
*   **Logic**: Each genre card is selectable. We also implemented a "Custom Genre" feature, allowing users to define their own tags that persist to the backend.

### 3. Interactive Calendar
*   **Drag & Drop**: Users can drag movie posters onto specific dates.
*   **State Sync**: The local state instantly updates for immediate feedback, while an async request syncs the change to MongoDB in the background (Optimistic UI).
*   **Conflict Handling**: Logic to prevent scheduling duplicate items on the same day.

### 4. My Space (Dashboard)
*   **Aggregated View**: A powerful dashboard that flattens nested calendar data into a searchable, filterable list.
*   **Client-Side Filtering**: Real-time filtering by **Category** (Movies/Series), **Status** (Watched/Watching/Upcoming), and **Genres**.
*   **Performance**: Uses `useMemo` to efficiently recalculate the filtered list only when dependencies change, handling hundreds of entries without lag.

## 🔧 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Rana3112/Movie-Catalogue.git
    cd Movie-Catalogue
    ```

2.  **Install Dependencies**
    ```bash
    # Root (Frontend)
    npm install
    
    # Server (Backend)
    cd server
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root and server directories with your keys (MongoDB URI, Google Client ID).

4.  **Run Development Servers**
    ```bash
    # Terminal 1 (Backend)
    cd server
    npm start

    # Terminal 2 (Frontend)
    npm run dev
    ```

## 🏗️ Deployment
This project is optimized for deployment on **Vercel** (Frontend) and **Render/Vercel** (Backend).

---
[live website](https://movie-catalogue-taupe.vercel.app/)
