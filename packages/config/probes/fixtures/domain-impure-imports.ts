import { useState } from "react";
import { query } from "convex/server";
import { auth } from "@clerk/nextjs";

export const impure = [useState, query, auth];
