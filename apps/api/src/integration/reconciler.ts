import { PrismaService } from '@/prisma/prisma.service'
import IntegrationFactory from './plugins/integration.factory'
import { decryptMetadata, encryptMetadata } from '@/common/util'
import { Integration } from '@prisma/client'

/**
 * Simple reconciler that looks for `pendingCleanup` entries inside
 * integration.metadata and attempts to re-run the cleanup action.
 * On success the pendingCleanup entry is removed from metadata.
 */
export async function processPendingCleanups(prisma: PrismaService) {
  // Fetch all integrations (metadata is encrypted)
  const integrations: Integration[] = await (
    prisma as any
  ).integration.findMany()

  for (const integration of integrations) {
    try {
      const metadata = decryptMetadata<any>(integration.metadata as string)
      if (!metadata || !Array.isArray(metadata.pendingCleanup)) continue

      // Work on a shallow copy of pendingCleanup so we can update after processing
      const pending = [...metadata.pendingCleanup]

      for (const entry of pending) {
        try {
          // Create integration object and let it attempt the cleanup via emitEvent
          const integrationInstance = IntegrationFactory.createIntegration(
            integration as any,
            prisma as any
          )

          // Compose a synthetic event for the type we want to replay
          await integrationInstance.emitEvent({
            event: {
              id: `reconciler-${entry.environmentId}-${Date.now()}`,
              itemId: entry.environmentId,
              metadata: '{}'
            },
            eventType: entry.action
          } as any)

          // If successful, remove this pending entry and persist metadata
          const updatedMeta =
            decryptMetadata<any>(integration.metadata as string) || {}
          updatedMeta.pendingCleanup = (
            updatedMeta.pendingCleanup || []
          ).filter(
            (p: any) =>
              !(
                p.environmentId === entry.environmentId &&
                p.action === entry.action
              )
          )

          await (prisma as any).integration.update({
            where: { id: integration.id },
            data: { metadata: encryptMetadata(updatedMeta as any) }
          })
        } catch (err) {
          // If reconciler attempt fails, leave entry as-is for next run
          // Log and continue
          // eslint-disable-next-line no-console
          console.warn(
            `Reconciler: failed to process pending cleanup for ${integration.id}: ${err}`
          )
        }
      }
    } catch (err) {
      // Skip malformed metadata
      // eslint-disable-next-line no-console
      console.warn(
        `Reconciler: failed to inspect integration ${integration.id}: ${err}`
      )
    }
  }
}
