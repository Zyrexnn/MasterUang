export interface Region {
    id: string;
    name: string;
    bbox: [[number, number], [number, number]];
    description: string;
}

export const REGIONS: Record<string, Region> = {
    SOUTHEAST_ASIA: {
        id: 'SOUTHEAST_ASIA',
        name: 'Asia Tenggara',
        bbox: [[-11, 90], [28, 141]],
        description: 'ARCHIPELAGO MONITORING'
    },
    EAST_ASIA: {
        id: 'EAST_ASIA',
        name: 'Asia Timur',
        bbox: [[20, 95], [55, 145]],
        description: 'NORTH PACIFIC SECTOR'
    },
    SOUTH_ASIA: {
        id: 'SOUTH_ASIA',
        name: 'Asia Selatan',
        bbox: [[5, 60], [37, 95]],
        description: 'INDIAN OCEAN GRID'
    },
    MIDDLE_EAST: {
        id: 'MIDDLE_EAST',
        name: 'Timur Tengah',
        bbox: [[12, 30], [42, 65]],
        description: 'RED SEA / GULF ZONE'
    },
    EUROPE: {
        id: 'EUROPE',
        name: 'Europe',
        bbox: [[35, -10], [70, 40]],
        description: 'CONTINENTAL EU WATERS'
    },
    AFRICA: {
        id: 'AFRICA',
        name: 'Africa',
        bbox: [[-35, -20], [37, 51]],
        description: 'PAN-AFRICAN COASTAL'
    },
    NORTH_AMERICA: {
        id: 'NORTH_AMERICA',
        name: 'North America',
        bbox: [[10, -170], [80, -50]],
        description: 'ATLANTIC / PACIFIC US'
    },
    SOUTH_AMERICA: {
        id: 'SOUTH_AMERICA',
        name: 'South America',
        bbox: [[-60, -80], [15, -35]],
        description: 'LATAM SOUTHERN CONE'
    },
    OCEANIA: {
        id: 'OCEANIA',
        name: 'Oceania/Australia',
        bbox: [[-50, 110], [-10, 180]],
        description: 'TASMAN / CORAL SEA'
    },
    GLOBAL: {
        id: 'GLOBAL',
        name: 'Global',
        bbox: [[-90, -180], [90, 180]],
        description: 'PLANETARY SURVEILLANCE'
    }
};

export const DEFAULT_REGION = REGIONS.SOUTHEAST_ASIA;
