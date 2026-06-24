import { useState, useEffect } from "react";
import { categories as fallbackCategories } from "@/data/categories";

export function useCategories() {
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
        } else {
          setCategoriesList(fallbackCategories);
        }
      })
      .catch(() => {
        setCategoriesList(fallbackCategories);
      })
      .finally(() => setLoading(false));
  }, []);

  return { categoriesList, loading };
}
