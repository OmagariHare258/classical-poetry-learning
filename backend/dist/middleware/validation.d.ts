import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validatePoemQuery: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validatePoemId: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateN8nWorkflow: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateAiRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateGenerateHint: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateGenerateImage: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateLearningProgress: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const handleValidationError: (error: Joi.ValidationError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const validateFileUpload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validation.d.ts.map