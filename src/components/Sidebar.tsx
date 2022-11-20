// a simple react component that renders a sidebar
import clsx from 'clsx';

export interface SidebarItem {
  id: string;
  name: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  onItemSelect: (item: SidebarItem) => void;
}

export function Sidebar(props: SidebarProps) {
  return (
    <div className="absolute z-10 bg-gray-5 h-[100%] w-[250px] top-0 rounded-2xl my-4 mx-2 p-4">
      <div className="pb-8 text-lg">Prompt Explorer</div>
      <div className="flex flex-col">
        {props.items.map((item) => (
          <div
            key={item.id}
            className={clsx(
              'rounded-md border border-solid border-white p-2',
              'hover:bg-gray-10',
              'flex justify-between items-center'
            )}
          >
            <div>{item.name}</div>
            <div className="select-none cursor-pointer" onClick={() => props.onItemSelect(item)}>
              ➕
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
