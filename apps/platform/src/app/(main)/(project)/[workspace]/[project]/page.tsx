import React from 'react'

function ProjectPage({ params }: { params: { project: string } }) {
  return (
    <div>
      <h1>ProjectPage</h1>
      <p>project: {params.project}</p>
    </div>
  )
}

export default ProjectPage
