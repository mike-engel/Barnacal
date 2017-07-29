//
//  CalendarViewController.swift
//  Barnacal
//
//  Created by Michael Engel on 7/27/17.
//  Copyright © 2017 Michael Engel. All rights reserved.
//

import Cocoa

class CalendarViewController: NSViewController {
    @IBOutlet var monthLabel: NSTextField!

    let formatter = DateFormatter()
    
    var date = Date()
    var calendar = Calendar(identifier: .gregorian)
    
    override func viewWillAppear() {
        setColors()
        setMonthLabel(date: date)
    }
    
    @IBAction func previousMonth(sender: NSButton) {
        print("go back")
    }
    
    @IBAction func nextMonth(sender: NSButton) {
        print("go forward")
    }
    
    @IBAction func quit(sender: NSButton) {
        print("quit the app")
    }
    
    func setColors() {
        backgroundColor.set()
        NSRectFill(self.view.bounds)
        monthLabel.textColor = foregroundColor
    }
    
    func setMonthLabel(date: Date) {
        formatter.dateFormat = "MMMM"
        
        let month = formatter.string(from: date)
        
        print("\(month)")
        
        monthLabel.stringValue = month
    }
}
