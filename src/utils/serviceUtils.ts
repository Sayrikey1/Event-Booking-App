import { StatusCodes } from 'http-status-codes';

// Handle error and return status with message
export const handleError = (err: any) => {
    return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: err.message,
    };
};

// Update entity with properties from data, ignoring undefined, null, or empty string values
export const updateEntity = <T>(entity: T, data: Partial<T>): T => {
    Object.keys(data).forEach((key) => {
        const typedKey = key as keyof T;
        if (
            data[typedKey] !== undefined &&
            data[typedKey] !== null &&
            data[typedKey] !== ""
        ) {
            entity[typedKey] = data[typedKey]!;
        }
    });
    return entity;
};
