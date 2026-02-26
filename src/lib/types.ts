export type Node = {
    id: string;
    x: number;
    y: number;
}

export type Room = {
    name: string;
    floor: number;
    show: boolean;
} & Node;


export type Building = {
    id: string;
    name: string;
    address: string;
};

export type PointPlacement = {
    title: string;
    src: string;
    floor: number;
    iconSize?: number;
} & Node;

export type StructureData = {
    junctions: Node[];
};


export type PathNode = {
    floor: number;
} & Node;

export type ClassPathResult = {
    fromClassId: string;
    toClassId: string;
    path: PathNode[];
    distance: number;
};

export type GraphEdge = PathNode & {
    dist: number;
};

export type OpenNode = PathNode & {
    g: number;
    f: number;
};
