import { SecretVersion, VariableVersion } from '@prisma/client'
import { UpdateEnvironment } from 'src/environment/dto/update.environment/update.environment'
import { UpdateProject } from 'src/project/dto/update.project/update.project'
import { UpdateSecret } from 'src/secret/dto/update.secret/update.secret'
import { UpdateVariable } from 'src/variable/dto/update.variable/update.variable'
import { UpdateWorkspace } from 'src/workspace/dto/update.workspace/update.workspace'

export interface UpdateWorkspaceMetadata {
  name?: UpdateWorkspace['name']
  description?: UpdateWorkspace['description']
  approvalEnabled?: UpdateWorkspace['approvalEnabled']
}

export interface UpdateProjectMetadata {
  name?: UpdateProject['name']
  description?: UpdateProject['description']
  storePrivateKey?: UpdateProject['storePrivateKey']
  accessLevel?: UpdateProject['accessLevel']
  regenerateKeyPair?: boolean
  privateKey?: UpdateProject['privateKey']
}

export interface UpdateEnvironmentMetadata {
  name?: UpdateEnvironment['name']
  description?: UpdateEnvironment['description']
  isDefault?: UpdateEnvironment['isDefault']
}

export interface UpdateSecretMetadata {
  name?: UpdateSecret['name']
  note?: UpdateSecret['note']
  rollbackVersion?: SecretVersion['version']
  value?: UpdateSecret['value']
  rotateAfter?: UpdateSecret['rotateAfter']
  environmentId?: UpdateSecret['environmentId']
}

export interface UpdateVariableMetadata {
  name?: UpdateVariable['name']
  note?: UpdateVariable['note']
  value?: UpdateVariable['value']
  rollbackVersion?: VariableVersion['version']
  environmentId?: UpdateVariable['environmentId']
}
