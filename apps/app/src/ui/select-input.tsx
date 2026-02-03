import { Select } from '@base-ui/react/select';
import { cn } from 'tailwind-variants';

import { CheckIcon, ChevronDownIcon } from './icons';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps extends React.ComponentProps<typeof Select.Root> {
  className?: string;
  options: readonly SelectOption[];
  placeholder?: string;
}

export function SelectInput({
  className,
  options,
  placeholder,
  ...props
}: SelectInputProps) {
  return (
    <Select.Root items={options} {...props}>
      <Select.Trigger
        className={cn(
          'bg-container-primary b1-600 text-text-high focus:border-green-40 flex w-full cursor-pointer items-center justify-between rounded-sm border border-transparent px-4 py-3 transition-colors focus:outline-none',
          className,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-text-medium">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="z-50 outline-none"
          sideOffset={8}
          alignItemWithTrigger={false}
        >
          <Select.Popup className="bg-container-primary border-container-secondary data-open:border-green-40 max-h-60 min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-sm border p-2 shadow-lg">
            <Select.List className="relative">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'b1-400 text-text-medium flex cursor-pointer items-center justify-between rounded-xs px-4 py-2 outline-none',
                    'data-highlighted:bg-container-secondary data-highlighted:b1-600 data-highlighted:text-text-high',
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="text-text-high">
                    <CheckIcon className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
