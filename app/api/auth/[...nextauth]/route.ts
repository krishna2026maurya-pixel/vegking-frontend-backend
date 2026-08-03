import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "vendor",
      name: "Vendor Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // DUMMY AUTH: Allow any email/password to login as a vendor
        if (credentials?.email && credentials?.password) {
          return {
            id: "vendor-1",
            name: "Dummy Vendor",
            email: credentials.email,
            role: "vendor",
            vendorStatus: "approved"
          };
        }
        return null;
      }
    }),
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim()?.toLowerCase();
        const password = credentials?.password;

        if (
          (email === 'admin@veggiemart.com' || email === 'admin@vegimart.com') && 
          password === 'admin123'
        ) {
          return {
            id: "admin-1",
            name: "Admin User",
            email: email,
            role: "admin",
          };
        }
        throw new Error("Invalid admin credentials");
      }
    }),
    CredentialsProvider({
      id: "user-login",
      name: "User Login",
      credentials: {
        mobile_no: { label: "Mobile Number", type: "text" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.mobile_no || !credentials?.otp) {
          throw new Error("Missing mobile number or OTP");
        }
        
        if (credentials.otp !== '1234') {
          throw new Error("Invalid OTP");
        }

        await connectDB();
        let user = await User.findOne({ mobile_no: credentials.mobile_no });
        
        if (!user) {
          user = await User.create({
            mobile_no: credentials.mobile_no,
            name: '',
            email: '',
            is_active: '1',
            wallet_balance: 0
          });
        }
        
        if (user.is_active === '0') {
          throw new Error("Account suspended");
        }
        
        return {
          id: user._id.toString(),
          name: user.name,
          mobile_no: user.mobile_no,
          role: "user",
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.vendorStatus = (user as any).vendorStatus;
        token.id = user.id;
        token.mobile_no = (user as any).mobile_no;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).vendorStatus = token.vendorStatus;
        (session.user as any).id = token.id;
        (session.user as any).mobile_no = token.mobile_no;
      }
      return session;
    }
  },
  pages: {
    signIn: '/vendor/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "dummy-secret-key",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
