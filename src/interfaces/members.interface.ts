export interface Members {
    member: Member;
    role:   string;
}

export interface Member {
    id:          string;
    name:        string;
    lastName:    string;
    phone:       string;
    email:       string;
    password:    string;
    language:    string;
    createdAt:   Date;
    updatedAt:   Date;
    lastLogin:   null;
    company:     string;
    isActive:    boolean;
    isAvailable: boolean;
}
