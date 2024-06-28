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

```
├── web
    ├── public
    ├── src
    |      ├── app
    |      ├── components        
    |      └── utils
    └── config_files
```

### web
The main directory that contains all parts of the web app.

#### public
Contains static files and assets.

#### src
Contains the source code of the app.

- **app**: Holds the main pages and settings for the app.
- **components**: Reusable pieces used in the app.
- **utils**: Helper tools and functions that support the app.

#### config_files
Contains configuration files for the app.
