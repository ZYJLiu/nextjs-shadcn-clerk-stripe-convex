"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import Draggable from "react-draggable";

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

export function MapleStory() {
  const [image, setImage] = useState<string>(
    "https://maplestory.io/api/character/%7B%22itemId%22%3A2000%2C%22region%22%3A%22GMS%22%2C%22version%22%3A%22247%22%7D%2C%7B%22itemId%22%3A12000%2C%22region%22%3A%22GMS%22%2C%22version%22%3A%22247%22%7D/stand1/animated?showears=false&showLefEars=false&name=&flipX=false",
  );

  const [allItems, setAllItems] = useState<Item[] | null>(null);

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
    <div className="m-2 flex flex-col items-center">
      <Button variant={"secondary"} onClick={handleUpgradeClick}>
        Randomize
      </Button>

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
