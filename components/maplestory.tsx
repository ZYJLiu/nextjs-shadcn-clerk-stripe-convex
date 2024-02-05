"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import Draggable from "react-draggable";

import * as React from "react";
import {
  useReactTable,
  flexRender,
  ColumnDef,
  getCoreRowModel,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
} from "@/components/ui/table";

interface Item {
  requiredJobs: string[];
  requiredLevel: number;
  isCash: boolean;
  requiredGender: number;
  name: string;
  desc: string;
  id: number;
  typeInfo: {
    overallCategory: string;
    category: string;
    subCategory: string;
    lowItemId: number;
    highItemId: number;
  };
}

interface CurrentItem {
  itemId: number;
  region: string;
  version: string;
}

const categories = [
  { category: "Two-Handed Weapon", subCategory: null },
  { category: "One-Handed Weapon", subCategory: null },
  { category: "Armor", subCategory: "Shield" },
  { category: "Armor", subCategory: "Hat" },
  { category: "Armor", subCategory: "Cape" },
  { category: "Armor", subCategory: "Top" },
  { category: "Armor", subCategory: "Bottom" },
  { category: "Armor", subCategory: "Overall" },
  { category: "Armor", subCategory: "Glove" },
  { category: "Armor", subCategory: "Shoes" },
  { category: "Character", subCategory: "Face" },
  { category: "Character", subCategory: "Hair" },
  { category: "Accessory", subCategory: "Eye Decoration" },
  { category: "Accessory", subCategory: "Face Accessory" },
  { category: "Accessory", subCategory: "Earrings" },
];

const character = {
  skin: 2000,
};
const data = {
  region: "GMS",
  version: "247",
};

export function MapleStory() {
  const [image, setImage] = useState<string>(
    "https://maplestory.io/api/character/%7B%22itemId%22%3A2000%2C%22region%22%3A%22GMS%22%2C%22version%22%3A%22247%22%7D%2C%7B%22itemId%22%3A12000%2C%22region%22%3A%22GMS%22%2C%22version%22%3A%22247%22%7D/stand1/animated?showears=false&showLefEars=false&name=&flipX=false",
  );

  const [allItems, setAllItems] = useState<Item[] | null>(null);
  const [currentItems, setCurrentItems] = useState<Record<string, CurrentItem>>(
    {},
  );

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      setImgSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
    }
  }, [image]);

  function filterItemsByCategory(
    items: Item[],
    category: string,
    subCategory?: string,
  ) {
    const filtered = items.filter(
      (item) =>
        item.typeInfo.category === category &&
        (!subCategory || item.typeInfo.subCategory === subCategory),
    );
    return filtered;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://maplestory.io/api/GMS/247/item");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setAllItems(data);
        console.log("Data: ", data);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    };

    fetchData();
  }, []);

  async function handleUpgradeClick() {
    try {
      if (allItems && allItems.length > 0) {
        let newCurrentItems: Record<string, CurrentItem> = {};

        // Randomly choose between One-Handed and Two-Handed Weapon
        const weaponType =
          Math.random() < 0.5 ? "One-Handed Weapon" : "Two-Handed Weapon";

        // Randomly decide between Overall or Top and Bottom
        const isOverall = Math.random() < 0.5;

        // Randomly decide the pose
        const poseOptions = ["alert", "stand1"];
        let pose = poseOptions[Math.floor(Math.random() * poseOptions.length)];

        // If not alert, and weapon type is One-Handed, use stand1;
        if (pose !== "alert") {
          pose = weaponType === "One-Handed Weapon" ? "stand1" : "alert";
        }

        const categories = [
          { category: weaponType },
          // Include Shield only if One-Handed Weapon is chosen
          ...(weaponType === "One-Handed Weapon"
            ? [{ category: "Armor", subCategory: "Shield" }]
            : []),
          ...(isOverall
            ? [{ category: "Armor", subCategory: "Overall" }]
            : [
                { category: "Armor", subCategory: "Top" },
                { category: "Armor", subCategory: "Bottom" },
              ]),
          { category: "Armor", subCategory: "Glove" },
          { category: "Armor", subCategory: "Cape" },
          { category: "Armor", subCategory: "Hat" },
          { category: "Armor", subCategory: "Shoes" },
          { category: "Character", subCategory: "Face" },
          { category: "Character", subCategory: "Hair" },
          { category: "Accessory", subCategory: "Eye Decoration" },
          { category: "Accessory", subCategory: "Face Accessory" },
          { category: "Accessory", subCategory: "Earrings" },
        ];

        // Predefined items (head and body)
        const items = [
          {
            itemId: character.skin,
            region: data.region,
            version: data.version,
          },
          {
            itemId: character.skin + 10000,
            region: data.region,
            version: data.version,
          },
        ];

        categories.forEach(({ category, subCategory }) => {
          const filteredItems = filterItemsByCategory(
            allItems,
            category,
            subCategory,
          );
          if (filteredItems.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * filteredItems.length,
            );
            const selectedItem = filteredItems[randomIndex];

            const newItemKey = subCategory
              ? `${category}:${subCategory}`
              : category;

            newCurrentItems[newItemKey] = {
              itemId: selectedItem.id,
              region: data.region,
              version: data.version,
            };

            items.push(newCurrentItems[newItemKey]);
          }
        });

        setCurrentItems(newCurrentItems);

        console.log(currentItems);
        console.log("All items: ", items);

        // Efficiently build the parameters string
        const params = items.reduce((acc, item, index) => {
          const itemStr = encodeURIComponent(JSON.stringify(item));
          return acc + (index > 0 ? "," : "") + itemStr;
        }, "");

        const url = `https://maplestory.io/api/character/${params}/${pose}/animated?showears=false&showLefEars=false&name=&flipX=false`;
        console.log("URL: ", url);
        setImage(url);
      } else {
        console.log("No items to select from.");
      }
    } catch (error) {
      console.error("Fetch error: ", error);
    }
  }

  function randomizeCategory(category: string, subCategory?: string) {
    console.log("Randomizing category: ", category, subCategory);
    if (allItems && allItems.length > 0) {
      const filteredItems = filterItemsByCategory(
        allItems,
        category,
        subCategory,
      );
      if (filteredItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredItems.length);
        const selectedItem = filteredItems[randomIndex];

        const newItemKey = subCategory
          ? `${category}:${subCategory}`
          : category;
        const newItem = {
          itemId: selectedItem.id,
          region: data.region,
          version: data.version,
        };

        setCurrentItems((prevItems) => ({
          ...prevItems,
          [newItemKey]: newItem,
        }));

        // Predefined items (head and body)
        const items = [
          {
            itemId: character.skin,
            region: data.region,
            version: data.version,
          },
          {
            itemId: character.skin + 10000,
            region: data.region,
            version: data.version,
          },
        ];

        // Build a new set of items with the updated item and required items
        const newItems = [
          ...items,
          ...Object.values({ ...currentItems, [newItemKey]: newItem }),
        ];

        const pose = "alert"; // Update this logic as per your requirement

        // Efficiently build the parameters string
        const params = newItems
          .map((item) => encodeURIComponent(JSON.stringify(item)))
          .join(",");

        console.log("Params: ", params);
        const url = `https://maplestory.io/api/character/${params}/${pose}/animated?showears=false&showLefEars=false&name=&flipX=false`;
        console.log("URL: ", url);
        setImage(url);
      }
    }
  }

  function toggleItemSelection(
    category: string,
    subCategory: string,
    isSelected: boolean,
  ) {
    const key = subCategory ? `${category}:${subCategory}` : category;

    setCurrentItems((prevItems) => {
      let newItems = { ...prevItems };
      if (isSelected) {
        randomizeCategory(category, subCategory);
      } else {
        delete newItems[key];
      }

      const requiredItems = [
        { itemId: character.skin, region: data.region, version: data.version },
        {
          itemId: character.skin + 10000,
          region: data.region,
          version: data.version,
        },
      ];

      const itemsForUrl = [...requiredItems, ...Object.values(newItems)];
      const params = itemsForUrl
        .map((item) => encodeURIComponent(JSON.stringify(item)))
        .join(",");
      const url = `https://maplestory.io/api/character/${params}/alert/animated?showears=false&showLefEars=false&name=&flipX=false`;
      setImage(url);

      return newItems;
    });
  }

  return (
    <div className="m-3 flex flex-row items-start space-x-2">
      <div className="flex w-[600px] max-w-full flex-col items-center">
        <CategoryTable
          currentItems={currentItems}
          randomizeCategory={randomizeCategory}
          toggleItemSelection={toggleItemSelection}
        />
      </div>

      <div className="mt-6 flex flex-col items-center px-10">
        <Button size="lg" className="text-lg " onClick={handleUpgradeClick}>
          Randomize
        </Button>

        <div className="relative mt-8 flex h-[700px] w-[600px] items-center justify-center overflow-hidden rounded-3xl border-2 bg-black shadow-lg">
          <Draggable>
            <img
              className="object-contain"
              draggable={false}
              ref={imgRef}
              src={image}
              alt="Maple Story"
              width={imgSize.width * 3}
              height={imgSize.height * 3}
              onLoad={() => {
                if (imgRef.current) {
                  setImgSize({
                    width: imgRef.current.naturalWidth,
                    height: imgRef.current.naturalHeight,
                  });
                }
              }}
            />
          </Draggable>
        </div>
      </div>
    </div>
  );
}

function CategoryTable({
  currentItems,
  randomizeCategory,
  toggleItemSelection,
}: {
  currentItems: Record<string, CurrentItem>;
  randomizeCategory: (category: string, subCategory?: string) => void;
  toggleItemSelection: (
    category: string,
    subCategory: string,
    isSelected: boolean,
  ) => void;
}) {
  const columns = React.useMemo<ColumnDef<(typeof categories)[0]>[]>(
    () => [
      {
        header: "Category",
        accessorKey: "category",
      },
      {
        header: "Subcategory",
        accessorKey: "subCategory",
        cell: (info) => info.getValue() || "",
      },
      {
        id: "selected",
        header: "Selected",
        cell: ({ row }) => {
          const category = row.original.category.toString();
          const subCategory = row.original.subCategory
            ? row.original.subCategory.toString()
            : "";
          const key = subCategory ? `${category}:${subCategory}` : category;
          const isSelected = !!currentItems[key];

          const handleCheckboxChange = () => {
            toggleItemSelection(category, subCategory, !isSelected);
          };

          return (
            <Checkbox checked={isSelected} onClick={handleCheckboxChange} />
          );
        },
      },
      {
        id: "randomize",
        header: "Randomize",
        cell: ({ row }) => {
          const category = row.original.category.toString(); // Define 'category' here

          const subCategory = row.original.subCategory
            ? row.original.subCategory.toString()
            : ""; // Define 'subCategory' here

          // Use the same logic as in randomizeCategory function to construct the key
          const key = subCategory ? `${category}:${subCategory}` : category;

          const isSelected = currentItems[key];

          return (
            <Button
              size={"sm"}
              variant={"secondary"}
              disabled={!isSelected}
              onClick={() => randomizeCategory(category, subCategory)}
            >
              Randomize
            </Button>
          );
        },
      },
    ],
    [currentItems],
  );

  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
