import React from 'react'
import { Switch } from '@/components/ui/switch'
import Visible from '@/components/common/visible'
import WarningCard from '@/components/shared/warning-card'

interface CreateProjectNameProps {
  onChange: (value: boolean) => void,
  checked: boolean | undefined,
}

export default function CreateProjectStorePrivateKey({
  onChange,
  checked: switchChecked = false
}: CreateProjectNameProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-y-4">
                <div className="flex h-19.5 w-full items-center justify-between gap-4">
                  <div className="flex h-11.5 w-[22.563rem] flex-col items-start justify-center">
                    <h1 className="font-geist h-6 w-[18.688rem] text-[1rem] font-medium">
                      Should the private key be saved or not?
                    </h1>
                    <p className="h-5 text-sm text-[#A1A1AA] ">
                      Choose if you want to save your private key
                    </p>
                  </div>

                  <div className="p-0.5">
                    <Switch
                      checked={switchChecked}
                      onCheckedChange={(checked) => {
                        onChange(checked)
                      }}
                    />
                  </div>
                </div>
                <Visible if={switchChecked}>
                  <WarningCard>
                    Enabling this would save the private key in our database.
                    This would allow all permissible members to read your
                    secrets. In the unnatural event of a data breach, your
                    secrets might be exposed to attackers. We recommend you to
                    not save your private key.
                  </WarningCard>
                </Visible>
              </div>
  )
}
