import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExercisePicker } from './ExercisePicker'

/**
 * COD-91 · this widget claimed to be a combobox in its own docstring while
 * being a button over a list of buttons. `npm run a11y` passed it the whole
 * time, because that structure is valid — so the guard has to be here.
 *
 * Each test names the missing piece it catches. Arrow-key navigation in
 * particular has index arithmetic (a custom "+ Add" row shifts every later
 * option by one), and index arithmetic is what silently drifts.
 */
const LIB = ['Bench Press', 'Squat', 'Deadlift', 'Barbell Row']

function open() {
  return userEvent.setup()
}

describe('ExercisePicker', () => {
  it('exposes the combobox roles axe cannot assert', async () => {
    const user = open()
    render(<ExercisePicker value="" onPick={() => {}} library={LIB} />)
    const trigger = screen.getByRole('button', { name: 'Pick exercise' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const input = screen.getByRole('combobox', { name: 'Search or type a new exercise' })
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
    expect(screen.getAllByRole('option')).toHaveLength(LIB.length)
  })

  it('walks the options with the arrow keys and picks the highlighted one', async () => {
    const user = open()
    const onPick = vi.fn()
    render(<ExercisePicker value="" onPick={onPick} library={LIB} />)
    await user.click(screen.getByRole('button', { name: 'Pick exercise' }))
    const input = screen.getByRole('combobox')

    // Opens on the first option, not on nothing.
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0].id)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[2].id)
    await user.keyboard('{Enter}')
    expect(onPick).toHaveBeenCalledWith('Deadlift')
  })

  it('wraps at both ends rather than sticking', async () => {
    const user = open()
    render(<ExercisePicker value="" onPick={() => {}} library={LIB} />)
    await user.click(screen.getByRole('button', { name: 'Pick exercise' }))
    const input = screen.getByRole('combobox')
    await user.keyboard('{ArrowUp}')
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[LIB.length - 1].id)
  })

  it('counts the custom "+ Add" row as option 0, so later options do not shift', async () => {
    const user = open()
    const onPick = vi.fn()
    render(<ExercisePicker value="" onPick={onPick} library={LIB} recents={['Squat']} />)
    await user.click(screen.getByRole('button', { name: 'Pick exercise' }))
    await user.type(screen.getByRole('combobox'), 'Face Pull')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('+ Add')
    // One option only — nothing in the library matches "Face Pull".
    expect(options).toHaveLength(1)
    await user.keyboard('{Enter}')
    expect(onPick).toHaveBeenCalledWith('Face Pull')
  })

  it('marks the current exercise selected, which is not the same as highlighted', async () => {
    const user = open()
    render(<ExercisePicker value="Squat" onPick={() => {}} library={LIB} />)
    await user.click(screen.getByRole('button', { name: 'Exercise: Squat' }))
    const options = screen.getAllByRole('option')
    expect(options.find((o) => o.getAttribute('aria-selected') === 'true')).toHaveTextContent('Squat')
    // …and the keyboard highlight is still on the first row.
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = open()
    render(<ExercisePicker value="" onPick={() => {}} library={LIB} />)
    const trigger = screen.getByRole('button', { name: 'Pick exercise' })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('keeps the group headings out of the option list', async () => {
    const user = open()
    render(<ExercisePicker value="" onPick={() => {}} library={LIB} recents={['Squat']} />)
    await user.click(screen.getByRole('button', { name: 'Pick exercise' }))
    // "Recent" and "Library" are rendered, and neither is an option — an index
    // that counted them would move the highlight to nothing.
    expect(screen.getByText('Recent')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(LIB.length)
  })
})
