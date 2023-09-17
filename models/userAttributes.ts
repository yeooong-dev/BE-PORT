interface UserAttributes {
  id?: number;
  email: string;
  name: string;
  password: string;
  profile_image?: string | null;
}

export default UserAttributes;
