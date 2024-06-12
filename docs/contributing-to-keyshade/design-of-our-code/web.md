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
    |      ├── about/team
    |      ├── hero
    |      ├── sectionsvg
    |      └── shared
    ├── src
    |      ├── app
    |      |      └── main
    |      |            ├── (mdx)
    |      |                    ├── privacy
    |      |                    └── terms_and_condition
    |      |            ├── about
    |      |            └── career
    |      ├── components
    |      |            ├── colabEasy
    |      |            ├── hero
    |      |            ├── lifeEasySection
    |      |            ├── secretSection
    |      |            ├── shared
    |      |            ├── textRevealCardPreview
    |      |            └── ui
    |      └── utils
    └── config_files
```

### web
The main directory that contains all parts of the web app.

#### public
Contains static files and assets.

- **about/team**: Information and assets about the team.
- **hero**: Assets for the main or introduction section.
- **sectionsvg**: SVG files for different sections of the app.
- **shared**: Shared static files and images.

#### src
Contains the source code of the app.

- **app**: Holds the main pages and settings for the app.
  - **main**: The main part of the app with important pages.
    - **(mdx)**: Pages written in MDX format.
      - **privacy**: Privacy policy page.
      - **terms_and_condition**: Terms and conditions page.
    - **about**: Information about the product.
    - **career**: Job and career information.

- **components**: Reusable pieces used in the app.
  - **colabEasy**: Pieces for the 'colabEasy' feature.
  - **hero**: Pieces for the main banner or introduction section.
  - **lifeEasySection**: Pieces for the 'lifeEasySection' feature.
  - **secretSection**: Pieces for hidden or special features.
  - **shared**: Pieces used in many places in the app.
  - **textRevealCardPreview**: Pieces for showing text in a special way.
  - **ui**: Pieces that make up the user interface.

- **utils**: Helper tools and functions that support the app.

#### config_files
Contains configuration files for the app.
