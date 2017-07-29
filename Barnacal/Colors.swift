//
//  Colors.swift
//  Barnacal
//
//  Created by Michael Engel on 7/29/17.
//  Copyright © 2017 Michael Engel. All rights reserved.
//

import Cocoa

let darkMode = UserDefaults.standard.string(forKey: "AppleInterfaceStyle")

var backgroundColor: NSColor {
    get {
        if darkMode != nil {
            return NSColor(deviceRed:1.00, green:1.00, blue:1.00, alpha:1.00)
        } else {
            return NSColor(deviceRed:0.00, green:0.00, blue:0.00, alpha:1.00)
        }
    }
}

var foregroundColor: NSColor {
    get {
        if darkMode != nil {
            return NSColor(deviceRed:0.67, green:0.67, blue:0.67, alpha:1.00)
        } else {
            return NSColor(deviceRed:1.00, green:1.00, blue:1.00, alpha:1.00)
        }
    }
}
