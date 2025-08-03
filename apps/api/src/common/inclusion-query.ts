export const InclusionQuery = {
  Integration: {
    workspace: true,
    project: {
      select: {
        id: true,
        name: true,
        slug: true,
        workspaceId: true
      }
    },
    environments: {
      select: {
        id: true,
        name: true,
        slug: true
      }
    },
    lastUpdatedBy: {
      select: {
        id: true,
        name: true,
        profilePictureUrl: true
      }
    }
  },
  Secret: {
    lastUpdatedBy: {
      select: {
        id: true,
        name: true,
        profilePictureUrl: true
      }
    },
    versions: {
      select: {
        value: true,
        version: true,
        createdOn: true,
        environment: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        }
      }
    },
    project: {
      select: {
        id: true,
        name: true,
        slug: true,
        workspaceId: true,
        publicKey: true,
        privateKey: true,
        storePrivateKey: true
      }
    }
  },
  Variable: {
    lastUpdatedBy: {
      select: {
        id: true,
        name: true,
        profilePictureUrl: true
      }
    },
    versions: {
      select: {
        value: true,
        version: true,
        createdOn: true,
        environment: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        }
      }
    },
    project: {
      select: {
        id: true,
        name: true,
        slug: true,
        workspaceId: true
      }
    }
  },
  Environment: {
    project: {
      select: {
        id: true,
        name: true,
        slug: true,
        workspaceId: true
      }
    },
    lastUpdatedBy: {
      select: {
        id: true,
        name: true,
        profilePictureUrl: true
      }
    }
  },
  WorkspaceRole: {
    projects: {
      select: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            workspaceId: true
          }
        },
        environments: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    },
    workspace: true,
    workspaceMembers: {
      select: {
        id: true,
        roleId: true,
        workspaceMemberId: true
      }
    }
  },
  WorkspaceMember: {
    user: true,
    roles: {
      select: {
        id: true,
        role: true
      }
    }
  },
  Project: {
    lastUpdatedBy: {
      select: {
        id: true,
        name: true,
        profilePictureUrl: true
      }
    },
    secrets: true,
    variables: true,
    environments: true
  },
  Workspace: {
    lastUpdatedBy: {
      select: {
        id: true,
        name: true,
        profilePictureUrl: true
      }
    },
    subscription: true,
    members: {
      select: {
        id: true
      }
    },
    roles: {
      select: {
        id: true
      }
    },
    projects: {
      select: {
        id: true
      }
    },
    integrations: {
      select: {
        id: true
      }
    }
  }
}
