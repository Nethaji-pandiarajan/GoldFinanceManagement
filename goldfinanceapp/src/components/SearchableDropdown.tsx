import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface Item {
  id: string | number;
  name: string;
  [key: string]: any; 
}

interface SearchableDropdownProps {
  items: Item[];
  selected: Item | null;
  setSelected: (item: Item | null) => void;
  placeholder?: string;
}

export default function SearchableDropdown({ items, selected, setSelected, placeholder = 'Select...' }: SearchableDropdownProps) {
  const [query, setQuery] = useState('');

  const filteredItems =
    query === ''
      ? items
      : items.filter((item) => {
          const nameMatch = item.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''));
          const phoneMatch = item.phone ? item.phone.toString().includes(query) : false;
          return nameMatch || phoneMatch;
        });

  return (
    <Combobox value={selected} onChange={setSelected}>
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-[#1f2628] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
          <Combobox.Input
            className="w-full border-none py-3 pl-3 pr-10 text-base leading-5 text-white bg-[#1f2628] focus:ring-0 focus:outline-none"
            displayValue={(item: Item) => item?.name || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#1f2628] py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
            {filteredItems.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-400">
                Nothing found.
              </div>
            ) : (
              filteredItems.map((item) => (
                <Combobox.Option
                  key={item.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-[#c69909] text-black' : 'text-white'
                    }`
                  }
                  value={item}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        <div className="flex justify-between items-center">
                          <span>{item.name}</span>
                          {item.phone && <span className={`text-sm ${active ? 'text-gray-800' : 'text-gray-400'}`}>{item.phone}</span>}
                        </div>
                      </span>
                      {selected ? (
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-black' : 'text-[#c69909]'}`}>
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}