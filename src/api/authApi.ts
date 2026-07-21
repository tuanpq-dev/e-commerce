import axiosClient from "./axiosClient";

export interface UpdateAuthDto {
  name?: string;
  phone?: string;
  image?: string;
}

export interface UpdateAuthResponse {
  message: string;
  data: {
    id: number;
    email: string;
    fullname: string;
    phone?: string;
    image?: string;
    role: string;
    updatedAt: string;
  };
}

/**
  * API Cập nhật thông tin user
  * Method: PATCH
  * URL: auth/:id
  */
export const updateAuthProfileApi = async (
  id: number | string,
  payload: UpdateAuthDto
): Promise<UpdateAuthResponse> => {
  return await axiosClient.patch(`/auth/${id}`, payload);
};
