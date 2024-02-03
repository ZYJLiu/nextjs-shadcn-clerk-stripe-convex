"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import Image from "next/image";
import Draggable from "react-draggable";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

const categoryItems = [
  { id: "One-Handed Weapon", label: "One-Handed Weapon" },
  { id: "Two-Handed Weapon", label: "Two-Handed Weapon" },
  { id: "Armor: Shield", label: "Shield" },
  { id: "Armor: Overall", label: "Overall" },
  { id: "Armor: Top", label: "Top" },
  { id: "Armor: Bottom", label: "Bottom" },
  { id: "Armor: Glove", label: "Glove" },
  { id: "Armor: Cape", label: "Cape" },
  { id: "Armor: Hat", label: "Hat" },
  { id: "Armor: Shoes", label: "Shoes" },
  { id: "Character: Face", label: "Face" },
  { id: "Character: Hair", label: "Hair" },
  { id: "Accessory: Eye Decoration", label: "Eye Decoration" },
  { id: "Accessory: Face Accessory", label: "Face Accessory" },
  { id: "Accessory: Earrings", label: "Earrings" },
];

const FormSchema = z.object({
  selectedCategories: z.array(z.string()).refine(
    (selectedCategories) => {
      const hasOneHanded = selectedCategories.includes("One-Handed Weapon");
      const hasTwoHanded = selectedCategories.includes("Two-Handed Weapon");
      // One-handed and two-handed weapon cannot both be selected
      return !(hasOneHanded && hasTwoHanded);
    },
    // {
    //   message:
    //     "Select either a one-handed or a two-handed weapon, but not both.",
    // },
  ),
  // .refine(
  //   (selectedCategories) => {
  //     const hasOverall = selectedCategories.includes("Overall");
  //     const hasTop = selectedCategories.includes("Top");
  //     const hasBottom = selectedCategories.includes("Bottom");

  //     // If 'Overall' is selected, 'Top' and 'Bottom' cannot be selected
  //     // If 'Top' or 'Bottom' is selected, 'Overall' cannot be selected
  //     if (hasOverall) {
  //       if (hasTop || hasBottom) {
  //         return false;
  //       }
  //       return !(hasTop || hasBottom);
  //     } else if (hasTop || hasBottom) {
  //       return !hasOverall;
  //     } else {
  //       // No selection of 'Overall', 'Top', or 'Bottom' is also valid
  //       return true;
  //     }
  //   },
  //   {
  //     message:
  //       "If 'Overall' is selected, neither 'Top' nor 'Bottom' can be selected, and vice versa.",
  //   },
  // ),
});

export function MapleStory() {
  const [image, setImage] = useState<string>(
    "https://maplestory.io/api/character/%7B%22itemId%22%3A2000%2C%22region%22%3A%22GMS%22%2C%22version%22%3A%22247%22%7D%2C%7B%22itemId%22%3A12000%2C%22region%22%3A%22GMS%22%2C%22version%22%3A%22247%22%7D/stand1/animated?showears=false&showLefEars=false&name=&flipX=false",
  );

  const [allItems, setAllItems] = useState<Item[] | null>(null);

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedCategories: categoryItems.map((item) => item.id),
    },
  });

  const { errors } = form.formState;

  const onSubmit = (formData) => {
    try {
      if (allItems && allItems.length > 0) {
        // Initialize with mandatory items
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

        // Append randomly selected items from selected categories
        formData.selectedCategories.forEach((categoryId) => {
          // Extract category and subCategory from categoryId
          const [category, subCategory] = categoryId.split(": ");

          // Filter items based on category and subCategory
          const filteredItems = filterItemsByCategory(
            allItems,
            category,
            subCategory,
          );

          // Randomly select an item if available
          if (filteredItems.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * filteredItems.length,
            );
            items.push({
              itemId: filteredItems[randomIndex].id,
              region: data.region,
              version: data.version,
            });
          }
        });

        // // // Randomly decide the pose
        // const poseOptions = ["alert", "stand1", "stand2"];
        // let pose = poseOptions[Math.floor(Math.random() * poseOptions.length)];
        // if (pose !== "alert") {
        //   if (formData.selectedCategories.includes("One-Handed Weapon")) {
        //     pose = "stand1";
        //   } else if (
        //     formData.selectedCategories.includes("Two-Handed Weapon")
        //   ) {
        //     pose = "stand2";
        //   }
        // }
        const pose = "alert";

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
  };

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

  const character = {
    skin: 2000,
  };
  const data = {
    region: "GMS",
    version: "247",
  };
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

  async function handleUpgradeClick() {
    try {
      if (allItems && allItems.length > 0) {
        // Randomly choose between One-Handed and Two-Handed Weapon
        const weaponType =
          Math.random() < 0.5 ? "One-Handed Weapon" : "Two-Handed Weapon";

        // Randomly decide between Overall or Top and Bottom
        const isOverall = Math.random() < 0.5;

        // Randomly decide the pose
        const poseOptions = ["alert", "stand1", "stand2"];
        let pose = poseOptions[Math.floor(Math.random() * poseOptions.length)];

        // If not alert, and weapon type is One-Handed, use stand1; if Two-Handed, use stand2
        if (pose !== "alert") {
          pose = weaponType === "One-Handed Weapon" ? "stand1" : "stand2";
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
            const newItem = {
              itemId: selectedItem.id,
              region: data.region,
              version: data.version,
            };
            items.push(newItem);
          }
        });

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

  return (
    <div className="m-2 flex flex-row items-center space-x-2">
      <Button variant={"secondary"} onClick={handleUpgradeClick}>
        Randomize
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="selectedCategories"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Categories</FormLabel>
                  <FormDescription>
                    Select the categories you want to include.
                  </FormDescription>
                </div>
                {categoryItems.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="selectedCategories"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, item.id]
                                  : field.value.filter(
                                      (value) => value !== item.id,
                                    );
                                field.onChange(newValue); // Update form field value
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={Object.keys(errors).length > 0}>
            Randomize
          </Button>
        </form>
      </Form>

      <Draggable>
        <div className="relative mt-2">
          <img
            draggable={false}
            ref={imgRef}
            src={image}
            alt="Maple Story"
            width={imgSize.width * 2}
            height={imgSize.height * 2}
            onLoad={() => {
              if (imgRef.current) {
                setImgSize({
                  width: imgRef.current.naturalWidth,
                  height: imgRef.current.naturalHeight,
                });
              }
            }}
          />
        </div>
      </Draggable>
    </div>
  );
}
