//! Rust port of `phase2/parse_gcode.py`.
//!
//! Public entrypoint: `write_parsed_gcode_json(input_path, output_path) -> u64`,
//! same signature as the original Python helper.  Streams the input G-code
//! line by line, tracks state modifiers (G90/G91/M82/M83/G92), resolves
//! G0/G1/G2/G3 movements to absolute coordinates, and writes a JSON array of
//! row objects to the output file.

use pyo3::prelude::*;
use std::fs::File;
use std::io::{self, BufRead, BufReader, BufWriter, Write};

const OUT_BUF: usize = 1 << 20;
const IN_BUF: usize = 1 << 20;

#[derive(Default)]
struct Params {
    x: Option<f64>,
    y: Option<f64>,
    z: Option<f64>,
    e: Option<f64>,
    i: Option<f64>,
    j: Option<f64>,
}

struct State {
    x: f64,
    y: f64,
    z: f64,
    e: f64,
    abs_coords: bool,
    abs_extrusion: bool,
}

impl State {
    fn new() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            e: 0.0,
            abs_coords: true,
            abs_extrusion: true,
        }
    }
}

#[inline]
fn is_param_key(c: u8) -> bool {
    matches!(c, b'X' | b'Y' | b'Z' | b'E' | b'I' | b'J' | b'F')
}

fn parse_params(line: &[u8]) -> Params {
    let mut p = Params::default();
    let n = line.len();
    let mut i = 0;
    while i < n {
        let c = line[i];
        if !is_param_key(c) {
            i += 1;
            continue;
        }
        let key = c;
        i += 1;
        let start = i;
        if i < n && (line[i] == b'+' || line[i] == b'-') {
            i += 1;
        }
        let mut saw_digit = false;
        while i < n && line[i].is_ascii_digit() {
            saw_digit = true;
            i += 1;
        }
        if i < n && line[i] == b'.' {
            i += 1;
            while i < n && line[i].is_ascii_digit() {
                saw_digit = true;
                i += 1;
            }
        }
        if !saw_digit {
            continue;
        }
        let num_bytes = &line[start..i];
        let value: f64 = match fast_float::parse(num_bytes) {
            Ok(v) => v,
            Err(_) => continue,
        };
        match key {
            b'X' => p.x = Some(value),
            b'Y' => p.y = Some(value),
            b'Z' => p.z = Some(value),
            b'E' => p.e = Some(value),
            b'I' => p.i = Some(value),
            b'J' => p.j = Some(value),
            _ => {} // F is ignored
        }
    }
    p
}

#[inline]
fn trim_ascii(s: &[u8]) -> &[u8] {
    let mut start = 0usize;
    let mut end = s.len();
    while start < end && s[start].is_ascii_whitespace() {
        start += 1;
    }
    while end > start && s[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    &s[start..end]
}

/// Convert a `ryu` shortest-round-trip string to Python's `repr(float)` form.
/// Python uses fixed notation when the implied decimal point lies in
/// `(-4, 17)` (i.e., 1e-4 <= |v| < 1e16), and scientific otherwise. The
/// scientific exponent is always shown with a sign and a minimum of two
/// digits (e.g. `1e-05`, `1.5e-16`, `1e+20`).
fn write_canonical_float<W: Write>(w: &mut W, s: &str) -> io::Result<()> {
    let bytes = s.as_bytes();

    let ei = bytes
        .iter()
        .position(|b| *b == b'e' || *b == b'E');
    let (mantissa, exp): (&str, i32) = match ei {
        Some(p) => {
            let m = &s[..p];
            let e: i32 = s[p + 1..].parse().unwrap_or(0);
            (m, e)
        }
        None => (s, 0),
    };

    let (sign, mantissa) = if let Some(rest) = mantissa.strip_prefix('-') {
        ("-", rest)
    } else {
        ("", mantissa)
    };

    let dot_pos = mantissa.find('.');
    let (int_part, frac_part) = match dot_pos {
        Some(p) => (&mantissa[..p], &mantissa[p + 1..]),
        None => (mantissa, ""),
    };

    let int_len = int_part.len() as i32;
    // Position of the decimal point relative to the start of the digit
    // sequence in the absolute (non-scientific) form. e.g. value 0.5
    // yields total_int_pos = 0; value 120 yields total_int_pos = 3.
    let total_int_pos = int_len + exp;
    let total_digits = (int_part.len() + frac_part.len()) as i32;

    if !sign.is_empty() {
        w.write_all(sign.as_bytes())?;
    }

    let is_zero = int_part.bytes().all(|b| b == b'0')
        && frac_part.bytes().all(|b| b == b'0');
    let use_fixed = is_zero || (total_int_pos > -4 && total_int_pos < 17);

    if use_fixed {
        if total_int_pos <= 0 {
            w.write_all(b"0.")?;
            for _ in 0..(-total_int_pos) {
                w.write_all(b"0")?;
            }
            w.write_all(int_part.as_bytes())?;
            w.write_all(frac_part.as_bytes())?;
        } else if total_int_pos >= total_digits {
            w.write_all(int_part.as_bytes())?;
            w.write_all(frac_part.as_bytes())?;
            for _ in 0..(total_int_pos - total_digits) {
                w.write_all(b"0")?;
            }
            w.write_all(b".0")?;
        } else if total_int_pos <= int_len {
            w.write_all(&int_part.as_bytes()[..total_int_pos as usize])?;
            w.write_all(b".")?;
            w.write_all(&int_part.as_bytes()[total_int_pos as usize..])?;
            w.write_all(frac_part.as_bytes())?;
        } else {
            let frac_consumed = (total_int_pos - int_len) as usize;
            w.write_all(int_part.as_bytes())?;
            w.write_all(&frac_part.as_bytes()[..frac_consumed])?;
            w.write_all(b".")?;
            w.write_all(&frac_part.as_bytes()[frac_consumed..])?;
        }
    } else {
        // Scientific: combine digits, drop leading zeros, place decimal
        // after the first significant digit, recompute the exponent.
        let int_bytes = int_part.as_bytes();
        let frac_bytes = frac_part.as_bytes();
        let total = int_bytes.len() + frac_bytes.len();
        let mut digits = Vec::with_capacity(total);
        digits.extend_from_slice(int_bytes);
        digits.extend_from_slice(frac_bytes);

        let first_nonzero = digits.iter().position(|b| *b != b'0').unwrap_or(0);
        let mut end = digits.len();
        while end > first_nonzero + 1 && digits[end - 1] == b'0' {
            end -= 1;
        }
        let sig = &digits[first_nonzero..end];
        let new_exp = total_int_pos - 1 - first_nonzero as i32;

        w.write_all(&sig[..1])?;
        if sig.len() > 1 {
            w.write_all(b".")?;
            w.write_all(&sig[1..])?;
        }
        w.write_all(b"e")?;
        if new_exp >= 0 {
            w.write_all(b"+")?;
        } else {
            w.write_all(b"-")?;
        }
        let abs_exp = new_exp.unsigned_abs();
        if abs_exp < 10 {
            w.write_all(b"0")?;
        }
        let mut tmp = itoa_u32(abs_exp);
        w.write_all(&tmp.as_bytes_mut())?;
    }
    Ok(())
}

struct ItoaBuf {
    buf: [u8; 10],
    len: usize,
}

impl ItoaBuf {
    fn as_bytes_mut(&mut self) -> &[u8] {
        &self.buf[..self.len]
    }
}

fn itoa_u32(mut v: u32) -> ItoaBuf {
    let mut buf = [0u8; 10];
    if v == 0 {
        buf[0] = b'0';
        return ItoaBuf { buf, len: 1 };
    }
    let mut i = buf.len();
    while v > 0 {
        i -= 1;
        buf[i] = b'0' + (v % 10) as u8;
        v /= 10;
    }
    let len = buf.len() - i;
    let mut out = [0u8; 10];
    out[..len].copy_from_slice(&buf[i..]);
    ItoaBuf { buf: out, len }
}

#[inline]
fn write_float<W: Write>(w: &mut W, v: f64) -> io::Result<()> {
    if !v.is_finite() {
        return w.write_all(b"null");
    }
    let mut buf = ryu::Buffer::new();
    let s = buf.format_finite(v);
    write_canonical_float(w, s)
}

fn process_line<W: Write>(
    line: &[u8],
    state: &mut State,
    w: &mut W,
    first: &mut bool,
) -> io::Result<bool> {
    let line = match line.iter().position(|&b| b == b';') {
        Some(p) => &line[..p],
        None => line,
    };
    let line = trim_ascii(line);
    if line.is_empty() {
        return Ok(false);
    }

    let cmd_end = line
        .iter()
        .position(|b| b.is_ascii_whitespace())
        .unwrap_or(line.len());
    let cmd_raw = &line[..cmd_end];
    let cmd_len = cmd_raw.len().min(4);
    let mut cmd_upper = [0u8; 4];
    for (idx, &b) in cmd_raw.iter().take(cmd_len).enumerate() {
        cmd_upper[idx] = b.to_ascii_uppercase();
    }
    let cmd = &cmd_upper[..cmd_len];

    match cmd {
        b"G90" => {
            state.abs_coords = true;
            Ok(false)
        }
        b"G91" => {
            state.abs_coords = false;
            Ok(false)
        }
        b"M82" => {
            state.abs_extrusion = true;
            Ok(false)
        }
        b"M83" => {
            state.abs_extrusion = false;
            Ok(false)
        }
        b"G92" => {
            let p = parse_params(line);
            if let Some(x) = p.x {
                state.x = x;
            }
            if let Some(y) = p.y {
                state.y = y;
            }
            if let Some(z) = p.z {
                state.z = z;
            }
            if let Some(e) = p.e {
                state.e = e;
            }
            Ok(false)
        }
        b"G0" | b"G1" | b"G2" | b"G3" => {
            let p = parse_params(line);

            let x = match (state.abs_coords, p.x) {
                (true, Some(v)) => v,
                (true, None) => state.x,
                (false, Some(v)) => state.x + v,
                (false, None) => state.x,
            };
            let y = match (state.abs_coords, p.y) {
                (true, Some(v)) => v,
                (true, None) => state.y,
                (false, Some(v)) => state.y + v,
                (false, None) => state.y,
            };
            let z = match (state.abs_coords, p.z) {
                (true, Some(v)) => v,
                (true, None) => state.z,
                (false, Some(v)) => state.z + v,
                (false, None) => state.z,
            };
            let e = match (state.abs_extrusion, p.e) {
                (true, Some(v)) => v,
                (true, None) => state.e,
                (false, Some(v)) => state.e + v,
                (false, None) => state.e,
            };
            state.x = x;
            state.y = y;
            state.z = z;
            state.e = e;

            if !*first {
                w.write_all(b",")?;
            }
            *first = false;

            w.write_all(b"{\"X\":")?;
            write_float(w, x)?;
            w.write_all(b",\"Y\":")?;
            write_float(w, y)?;
            w.write_all(b",\"Z\":")?;
            write_float(w, z)?;
            w.write_all(b",\"E\":")?;
            write_float(w, e)?;
            if let Some(iv) = p.i {
                w.write_all(b",\"I\":")?;
                write_float(w, iv)?;
            }
            if let Some(jv) = p.j {
                w.write_all(b",\"J\":")?;
                write_float(w, jv)?;
            }
            w.write_all(b",\"type\":\"")?;
            w.write_all(cmd)?;
            w.write_all(b"\"}")?;
            Ok(true)
        }
        _ => Ok(false),
    }
}

fn parse_file(input_path: &str, output_path: &str) -> io::Result<u64> {
    let inf = File::open(input_path)?;
    let mut reader = BufReader::with_capacity(IN_BUF, inf);
    let outf = File::create(output_path)?;
    let mut writer = BufWriter::with_capacity(OUT_BUF, outf);

    writer.write_all(b"[")?;
    let mut state = State::new();
    let mut first = true;
    let mut count: u64 = 0;
    let mut buf: Vec<u8> = Vec::with_capacity(256);

    loop {
        buf.clear();
        let n = reader.read_until(b'\n', &mut buf)?;
        if n == 0 {
            break;
        }
        if process_line(&buf, &mut state, &mut writer, &mut first)? {
            count += 1;
        }
    }
    writer.write_all(b"]")?;
    writer.flush()?;
    Ok(count)
}

#[pyfunction]
fn write_parsed_gcode_json(input_path: &str, output_path: &str) -> PyResult<u64> {
    parse_file(input_path, output_path).map_err(|e| {
        PyErr::new::<pyo3::exceptions::PyIOError, _>(format!(
            "parse_file({}, {}): {}",
            input_path, output_path, e
        ))
    })
}

#[pymodule]
fn markey_gcode_parser(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(write_parsed_gcode_json, m)?)?;
    Ok(())
}
