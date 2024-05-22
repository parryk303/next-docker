export interface AxiosRequestObj {
	url: string;
	method: string;
	data?: any;
	headers?: any;
	responseType?: any;
	logLabel?: string;
};

// Define types for Smartsheet API responses
export interface Sheet {
	id: number;
	name: string;
	// Add other properties as needed
}

export interface ListResult<T> {
	data: T[];
	// Add other properties as needed
}

export interface Row {
	id: number;
	cells: Cell[];
	// Add other properties as needed
}

export interface Cell {
	value: string;
	// Add other properties as needed
}

