# Web

The web application is responsible for serving the homepage, providing users with access to its content and functionality, the stacks, and things you should know before you get started with it!

## Stack

- **Next.js** as the framework
- **React** as the frontend library
- **MDX** for Markdown and JSX integration
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations
- **Geist** for UI components
- **@tsparticles/engine, @tsparticles/react, @tsparticles/slim** for particle animations
- **Sonner** for notifications
- **TypeScript** for static typing

## Structure
markdown
Copy code

## Directory Descriptions

### app
The `app` directory contains the main application pages and global settings.

- **main**: The primary section of the application containing key pages.
  - **about**: Contains files and assets related to the 'About' page.
  - **career**: Contains files and assets related to the 'Career' page.

- **global CSS**: This directory holds global CSS styles that are applied across the entire app.

- **layout**: This directory includes layout components and settings for structuring the app's pages.

### components
The `components` directory contains reusable components used throughout the app.

- **colabEasy**: Specific components related to the 'colabEasy' feature/module.

- **hero**: Components related to the 'hero' section of the app, typically the main banner or introductory section.

- **lifeEasySection**: Components specific to the 'lifeEasySection' of the app.

- **secret section**: Components for the 'secret section' of the app, which might include hidden or exclusive features.

- **shared**: Shared components that are used in multiple places across the app.

- **textRevealCardPreview**: Components specifically designed for the 'textRevealCardPreview' feature, which likely involves some interactive or animated text reveal functionality.

- **ui**: UI-specific components that define the user interface elements of the app.

### utils
The `utils` directory includes utility functions and helper scripts that support the app's functionality.

---

This structure helps in maintaining a clean and organized codebase, making it easier to manage and scale the web application.