-- CreateTable
CREATE TABLE "_EnvironmentToProjectWorkspaceRoleAssociation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EnvironmentToProjectWorkspaceRoleAssociation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EnvironmentToProjectWorkspaceRoleAssociation_B_index" ON "_EnvironmentToProjectWorkspaceRoleAssociation"("B");

-- AddForeignKey
ALTER TABLE "_EnvironmentToProjectWorkspaceRoleAssociation" ADD CONSTRAINT "_EnvironmentToProjectWorkspaceRoleAssociation_A_fkey" FOREIGN KEY ("A") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnvironmentToProjectWorkspaceRoleAssociation" ADD CONSTRAINT "_EnvironmentToProjectWorkspaceRoleAssociation_B_fkey" FOREIGN KEY ("B") REFERENCES "ProjectWorkspaceRoleAssociation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
