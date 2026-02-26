import { useMemo } from "react";
import type { SelectItem } from "../components/ui/Select";
import { DATA } from "../lib/data";

export function useSelectableItems(): SelectItem[] {
  return useMemo<SelectItem[]>(() => {
    const pointTitlesById = DATA.POINTS.reduce((acc, point) => {
      const titles = acc.get(point.id) ?? [];
      titles.push(point.title);
      acc.set(point.id, titles);
      return acc;
    }, new Map<string, string[]>());

    const visibleRooms = DATA.ROOMS.filter((room) => room.show !== false);
    const visibleRoomIds = new Set(visibleRooms.map((room) => room.id));

    const roomItems = visibleRooms.map((room) => {
      const pointTitles = pointTitlesById.get(room.id);
      if (!pointTitles?.length) return { id: room.id, name: room.name };

      return {
        id: room.id,
        name: `${room.name} • ${pointTitles.join(", ")}`,
      };
    });

    const pointOnlyItems = DATA.POINTS.reduce<SelectItem[]>((acc, point) => {
      if (visibleRoomIds.has(point.id) || acc.some((item) => item.id === point.id)) return acc;
      acc.push({ id: point.id, name: point.title });
      return acc;
    }, []);

    return [...roomItems, ...pointOnlyItems];
  }, []);
}
